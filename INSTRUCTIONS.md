# RAG-Powered AI Chat Application - Setup Instructions

## Overview

This application provides a complete RAG (Retrieval-Augmented Generation) system that allows users to upload PDF documents and chat with them using AI. The system uses the `aimakerspace` library for PDF processing, text chunking, embeddings, and vector search.

## Features Implemented

✅ **PDF Upload & Processing**
- Upload PDF files through the web interface
- Extract text content using PyPDF2
- Split text into chunks with overlap for better context

✅ **Vector Database & RAG**
- Create embeddings using OpenAI's text-embedding-3-small
- Store vectors in an in-memory database using the `aimakerspace` library
- Semantic search to find relevant document chunks

✅ **Context-Aware Chat**
- Inject relevant PDF context into user queries
- AI responses limited to information from uploaded documents
- Streaming responses for better user experience

✅ **Enhanced UI**
- PDF upload status indicators
- Clear visual feedback for processing states
- RAG-specific prompts and messaging

## Quick Start

### 1. Backend Setup

```bash
# Navigate to the API directory
cd api

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
```

The backend will run on `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 3. Usage

1. **Open the application** at `http://localhost:3000`
2. **Enter your OpenAI API key** when prompted
3. **Upload a PDF document** using the file input
4. **Wait for processing** - you'll see a success message with chunk count
5. **Ask questions** about your document - the AI will only use PDF content

## How RAG Works in This Application

1. **Document Processing**:
   - PDF is uploaded and text is extracted
   - Text is split into 1000-character chunks with 200-character overlap
   - Each chunk is converted to an embedding vector

2. **Query Processing**:
   - User question is converted to an embedding
   - Vector similarity search finds the 3 most relevant chunks
   - Relevant chunks are injected as context in the AI prompt

3. **Response Generation**:
   - AI generates response using only the provided context
   - Responses stream back to the user in real-time

## Key Components

### Backend (`api/app.py`)
- **PDF Upload Endpoint**: `/api/upload-pdf` - processes PDFs using aimakerspace
- **Chat Endpoint**: `/api/chat` - enhanced with RAG context injection
- **Status Endpoints**: `/api/pdf-status`, `/api/clear-pdf` - manage PDF state

### Frontend (`frontend/src/components/ChatInterface.tsx`)
- **PDF Upload UI**: File input with processing indicators
- **Enhanced Chat**: Context-aware prompts and visual feedback
- **Status Management**: Real-time PDF processing state

### RAG Library (`aimakerspace/`)
- **PDFLoader**: Extract text from PDF files
- **CharacterTextSplitter**: Chunk text with overlap
- **VectorDatabase**: In-memory vector storage and search
- **EmbeddingModel**: OpenAI embedding integration

## Testing the Application

### 1. Test PDF Upload
- Upload a sample PDF (research paper, manual, etc.)
- Verify successful processing message
- Check that chunk count is displayed

### 2. Test RAG Functionality
- Ask specific questions about PDF content
- Verify AI responses use only document information
- Test with questions outside the document scope

### 3. Test Regular Chat
- Clear the PDF to test normal chat mode
- Verify the interface adapts appropriately

## Configuration Options

### Chunk Size and Overlap
In `api/app.py`, modify:
```python
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
```

### Number of Retrieved Chunks
In `api/app.py`, modify:
```python
relevant_chunks = vector_database.search_by_text(
    request.user_message, 
    k=3,  # Change this number
    return_as_text=True
)
```

### Embedding Model
In `aimakerspace/openai_utils/embedding.py`, modify:
```python
EmbeddingModel(embeddings_model_name="text-embedding-3-small")
```

## Troubleshooting

### Common Issues

1. **Import Errors**:
   - Ensure you're in the correct directory when running commands
   - Verify all dependencies are installed

2. **PDF Processing Fails**:
   - Check that the PDF contains extractable text (not just images)
   - Verify PyPDF2 can read the PDF format

3. **Embedding Errors**:
   - Confirm OpenAI API key is valid and has credits
   - Check network connectivity

4. **Frontend Build Issues**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Ensure Node.js version is 16+

### Error Messages

- **"Only PDF files are allowed"**: Upload a .pdf file
- **"Could not extract text from PDF"**: PDF may be image-based or corrupted
- **"No text chunks could be created"**: PDF text extraction succeeded but chunking failed

## Production Deployment

### Backend
- Deploy to Railway, Render, or AWS Lambda
- Set environment variables for OpenAI API key
- Configure CORS for your domain

### Frontend
- Deploy to Vercel, Netlify, or similar
- Update API endpoints to point to production backend
- Configure environment variables as needed

## Next Steps

Potential enhancements:
- Add support for multiple file formats (Word, TXT, etc.)
- Implement persistent vector storage (Pinecone, Weaviate)
- Add user authentication and document management
- Include citation tracking for source attribution
- Implement conversation memory across sessions

The application is now fully functional with RAG capabilities using the `aimakerspace` library!
