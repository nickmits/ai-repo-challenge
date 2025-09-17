# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import sys
import asyncio
import tempfile
from typing import Optional, List, Dict, Any
from pathlib import Path

# Add the parent directory to the Python path to import aimakerspace
sys.path.append(str(Path(__file__).parent.parent))

# Import the aimakerspace utilities for RAG functionality
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application with a title
app = FastAPI(title="RAG-Enabled Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Global variable to store the vector database for RAG
vector_database: Optional[VectorDatabase] = None
pdf_context: Optional[str] = None

# Define the data model for chat requests using Pydantic
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define response model for PDF upload
class PDFUploadResponse(BaseModel):
    success: bool
    message: str
    chunks_count: int

# Endpoint for uploading and processing PDF files
@app.post("/api/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form(...)):
    """Upload and process a PDF file for RAG functionality."""
    global vector_database, pdf_context
    
    try:
        # Validate API key
        if not api_key or api_key.strip() == "":
            raise HTTPException(status_code=400, detail="API key is required")
            
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Create a temporary file to store the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Load and process the PDF
            pdf_loader = PDFLoader(temp_file_path)
            pdf_loader.load_file()
            
            if not pdf_loader.documents:
                raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
            pdf_text = pdf_loader.documents[0]
            pdf_context = pdf_text
            
            # Split the text into chunks
            text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split(pdf_text)
            
            if not chunks:
                raise HTTPException(status_code=400, detail="No text chunks could be created from PDF")
            
            # Set the environment variable for the embedding model
            os.environ['OPENAI_API_KEY'] = api_key.strip()
            
            embedding_model = EmbeddingModel()
            
            # Create and populate vector database
            vector_database = VectorDatabase(embedding_model=embedding_model)
            vector_database = await vector_database.abuild_from_list(chunks)
            
            return PDFUploadResponse(
                success=True,
                message=f"PDF processed successfully. Extracted {len(chunks)} text chunks.",
                chunks_count=len(chunks)
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# Enhanced chat endpoint with RAG functionality
@app.post("/api/chat")
async def chat(request: ChatRequest):
    global vector_database, pdf_context
    
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Prepare the user message with context if available
        enhanced_user_message = request.user_message
        context = ""
        
        if vector_database is not None:
            try:
                # Search for relevant context using RAG
                relevant_chunks = vector_database.search_by_text(
                    request.user_message, 
                    k=3, 
                    return_as_text=True
                )
                
                if relevant_chunks:
                    context = "\n\n".join(relevant_chunks)
                    enhanced_user_message = f"""Based on the following context from the uploaded PDF, please answer the question. Only use information from the provided context. If the context doesn't contain enough information to answer the question, please say so.

Context:
{context}

Question: {request.user_message}"""
            except Exception as e:
                print(f"Error during RAG search: {e}")
                # Fall back to original message if RAG fails
                pass
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": request.developer_message},
                    {"role": "user", "content": enhanced_user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint to check if PDF is uploaded and processed
@app.get("/api/pdf-status")
async def pdf_status():
    """Check if a PDF has been uploaded and processed."""
    global vector_database
    
    return {
        "pdf_uploaded": vector_database is not None,
        "chunks_count": len(vector_database.vectors) if vector_database else 0
    }

# Endpoint to clear the uploaded PDF and reset the system
@app.post("/api/clear-pdf")
async def clear_pdf():
    """Clear the uploaded PDF and reset the RAG system."""
    global vector_database, pdf_context
    
    vector_database = None
    pdf_context = None
    
    return {"success": True, "message": "PDF cleared successfully"}

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
