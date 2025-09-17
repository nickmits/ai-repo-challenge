# Together AI Integration Guide

## Overview

This application now supports **Together AI** as an alternative to OpenAI, providing access to high-quality open-source language models at competitive pricing. Together AI offers a wide range of models including Llama, Mixtral, and other state-of-the-art open-source models.

## Features Added

✅ **Multi-Provider Support**: Switch between OpenAI and Together AI  
✅ **Model Selection**: Choose from available models for each provider  
✅ **Unified Interface**: Same chat experience regardless of provider  
✅ **RAG Compatibility**: Full RAG functionality with both providers  
✅ **Dynamic Model Loading**: Automatic model list retrieval  

## Getting Started with Together AI

### 1. Get Your Together AI API Key

1. Visit [api.together.xyz](https://api.together.xyz)
2. Create an account or sign in
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy the key (starts with something like `together_xxxxxxx`)

### 2. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

The `together==1.3.3` package is now included in requirements.txt.

### 3. Using Together AI in the Application

1. **Start the application** (both backend and frontend)
2. **Enter your Together AI API key** when prompted
3. **Select "Together AI"** from the API Provider dropdown
4. **Choose a model** from the available Together AI models
5. **Chat normally** - the interface works identically to OpenAI

## Available Models

### Together AI Models
- **meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo** - Fast, efficient Llama model
- **meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo** - Large, high-quality Llama model  
- **meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo** - Largest Llama model
- **mistralai/Mixtral-8x7B-Instruct-v0.1** - Mixture of Experts model
- **mistralai/Mixtral-8x22B-Instruct-v0.1** - Larger Mixtral model
- **NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO** - Fine-tuned Mixtral
- **Qwen/Qwen2-72B-Instruct** - Qwen language model

### OpenAI Models (for comparison)
- **gpt-4o-mini** - Fast, cost-effective
- **gpt-4o** - Latest GPT-4 model
- **gpt-4-turbo** - High-performance GPT-4
- **gpt-3.5-turbo** - Fast and reliable

## Technical Implementation

### Backend Changes

#### Enhanced ChatModel (`aimakerspace/openai_utils/chatmodel.py`)
```python
class ChatOpenAI:
    def __init__(
        self, 
        model_name: str = "gpt-4o-mini",
        api_provider: APIProvider = "openai",
        api_key: Optional[str] = None
    ):
        # Supports both OpenAI and Together AI
```

#### Updated API Endpoints
- **POST /api/chat** - Now accepts `api_provider` parameter
- **POST /api/upload-pdf** - Supports provider selection for embeddings
- **GET /api/models** - Returns available models for each provider

### Frontend Changes

#### New UI Components
- **API Provider Selector**: Switch between OpenAI and Together AI
- **Model Dropdown**: Dynamic model selection based on provider
- **Provider Information**: Shows current provider and model
- **API Key Guidance**: Links to get Together AI API keys

#### Enhanced State Management
```typescript
const [apiProvider, setApiProvider] = useState<'openai' | 'together'>('openai')
const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
const [availableModels, setAvailableModels] = useState<AvailableModels>({ openai: [], together: [] })
```

## Pricing Comparison

### Together AI Advantages
- **Lower Cost**: Generally more affordable than OpenAI
- **Open Source Models**: Support for open-source AI development
- **Transparent Pricing**: Clear per-token pricing
- **No Rate Limits**: Higher throughput capabilities

### OpenAI Advantages
- **Mature Models**: Well-tested GPT models
- **Consistent Performance**: Reliable quality
- **Wide Adoption**: Extensive documentation and community

## Usage Examples

### Basic Chat with Together AI
```javascript
// Frontend automatically handles provider selection
{
  "developer_message": "You are a helpful assistant",
  "user_message": "Hello!",
  "model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  "api_key": "together_your_api_key_here",
  "api_provider": "together"
}
```

### RAG with Together AI
```javascript
// Upload PDF with Together AI for embeddings
const formData = new FormData()
formData.append('file', pdfFile)
formData.append('api_key', 'together_your_api_key_here')
formData.append('api_provider', 'together')

// Chat with PDF context using Together AI
{
  "developer_message": "Answer based on PDF context",
  "user_message": "What is the main topic?",
  "model": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
  "api_key": "together_your_api_key_here",
  "api_provider": "together"
}
```

## Environment Variables

You can set default API keys as environment variables:

```bash
# .env file
OPENAI_API_KEY=sk-your-openai-key
TOGETHER_API_KEY=together_your-together-key
```

## Troubleshooting

### Common Issues

1. **"TOGETHER_API_KEY is not set"**
   - Ensure you're providing the API key through the UI
   - Check that the key starts with "together_"

2. **Model not found errors**
   - Verify the model name exactly matches Together AI's format
   - Check that the model is available in your Together AI plan

3. **Slower responses with Together AI**
   - This is normal for larger models (70B, 405B parameters)
   - Consider using smaller models (8B) for faster responses

4. **Rate limiting**
   - Together AI generally has higher rate limits
   - Check your Together AI dashboard for usage

### Performance Tips

1. **Model Selection**:
   - Use 8B models for fast responses
   - Use 70B+ models for complex reasoning
   - Mixtral models good balance of speed/quality

2. **Cost Optimization**:
   - Monitor token usage in Together AI dashboard
   - Use shorter prompts when possible
   - Consider caching responses for repeated queries

## API Reference

### New Endpoints

#### GET /api/models
Returns available models for each provider.

**Response:**
```json
{
  "openai": ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  "together": ["meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", "mistralai/Mixtral-8x7B-Instruct-v0.1"]
}
```

#### Enhanced POST /api/chat
**Request:**
```json
{
  "developer_message": "System prompt",
  "user_message": "User input",
  "model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  "api_key": "together_xxxxx",
  "api_provider": "together"
}
```

#### Enhanced POST /api/upload-pdf
**Form Data:**
- `file`: PDF file
- `api_key`: API key for the provider
- `api_provider`: "openai" or "together"

## Future Enhancements

Potential improvements to consider:
- **More Providers**: Add Anthropic, Cohere, etc.
- **Model Comparison**: Side-by-side model responses
- **Cost Tracking**: Real-time usage monitoring
- **Custom Models**: Support for fine-tuned models
- **Batch Processing**: Multiple document processing

## Support

For Together AI specific issues:
- [Together AI Documentation](https://docs.together.ai/)
- [Together AI Discord](https://discord.gg/together)
- [Together AI API Status](https://status.together.ai/)

For application issues:
- Check the console for error messages
- Verify API keys are valid
- Ensure all dependencies are installed

The application now provides a complete multi-provider RAG solution with the flexibility to choose between OpenAI's proven models and Together AI's innovative open-source alternatives!
