'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatInterfaceProps {
  apiKey: string
}

interface PDFStatus {
  pdf_uploaded: boolean
  chunks_count: number
}

interface AvailableModels {
  openai: string[]
  together: string[]
}

export default function ChatInterface({ apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPDF, setIsUploadingPDF] = useState(false)
  const [pdfStatus, setPdfStatus] = useState<PDFStatus>({ pdf_uploaded: false, chunks_count: 0 })
  const [apiProvider, setApiProvider] = useState<'openai' | 'together'>('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [availableModels, setAvailableModels] = useState<AvailableModels>({ 
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'], 
    together: ['meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'] 
  })
  
  const developerMessage = `You are a helpful AI assistant with specialized formatting rules.

When answering questions about uploaded PDFs, only use information from the provided context. If the context doesn't contain enough information to answer the question, clearly state that.

MATHEMATICAL PROBLEMS: Provide only the final answer with a brief 1-sentence explanation. Format: "Answer: [result]. [Brief explanation]"

REPHRASING/REWRITING: Structure responses professionally with clear sections, proper grammar, and logical flow.

SUMMARIZATION: Use **bold** for key points and bullet points (•) for semantic keys. Format:
• **Key Point 1**: Brief explanation
• **Key Point 2**: Brief explanation

For other questions, provide helpful, well-structured responses.`
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check PDF status and load available models on component mount
    checkPdfStatus()
    loadAvailableModels()
  }, [])

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (response.ok) {
        const models = await response.json()
        console.log('Loaded models:', models)
        setAvailableModels(models)
        
        // Set default model for current provider if not already set
        if (apiProvider === 'openai' && models.openai?.length > 0) {
          setSelectedModel(models.openai[0])
        } else if (apiProvider === 'together' && models.together?.length > 0) {
          setSelectedModel(models.together[0])
        }
      }
    } catch (error) {
      console.error('Error loading available models:', error)
      // Set default models if fetch fails
      const defaultModels = {
        openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        together: ['meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1']
      }
      console.log('Using default models:', defaultModels)
      setAvailableModels(defaultModels)
      
      // Set default model
      if (apiProvider === 'openai') {
        setSelectedModel(defaultModels.openai[0])
      } else {
        setSelectedModel(defaultModels.together[0])
      }
    }
  }

  // Update selected model when provider changes
  useEffect(() => {
    if (apiProvider === 'openai' && availableModels.openai.length > 0) {
      // Only change if current model is not available for OpenAI
      if (!availableModels.openai.includes(selectedModel)) {
        setSelectedModel(availableModels.openai[0])
      }
    } else if (apiProvider === 'together' && availableModels.together.length > 0) {
      // Only change if current model is not available for Together
      if (!availableModels.together.includes(selectedModel)) {
        setSelectedModel(availableModels.together[0])
      }
    }
  }, [apiProvider, availableModels, selectedModel])

  const checkPdfStatus = async () => {
    try {
      const response = await fetch('/api/pdf-status')
      if (response.ok) {
        const status = await response.json()
        setPdfStatus(status)
      }
    } catch (error) {
      console.error('Error checking PDF status:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file')
      return
    }

    // Check file size (4MB limit for Vercel Hobby plan)
    const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)
      alert(`File too large (${sizeMB}MB). Maximum allowed size is ${maxSizeMB}MB. Please use a smaller PDF file or upgrade to Vercel Pro for larger file support.`)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setIsUploadingPDF(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey)
      formData.append('api_provider', apiProvider)

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to upload PDF')
      }

      const result = await response.json()
      
      // Update PDF status
      await checkPdfStatus()
      
      // Add system message about successful upload
      const systemMessage: Message = {
        id: Date.now().toString(),
        content: `✅ PDF uploaded successfully! Processed ${result.chunks_count} text chunks. You can now ask questions about the PDF content.`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, systemMessage])

    } catch (error) {
      console.error('Error uploading PDF:', error)
      alert(`Error uploading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploadingPDF(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const clearPDF = async () => {
    try {
      const response = await fetch('/api/clear-pdf', {
        method: 'POST',
      })

      if (response.ok) {
        setPdfStatus({ pdf_uploaded: false, chunks_count: 0 })
        const systemMessage: Message = {
          id: Date.now().toString(),
          content: '🗑️ PDF cleared. The system has been reset.',
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, systemMessage])
      }
    } catch (error) {
      console.error('Error clearing PDF:', error)
      alert('Error clearing PDF')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: inputMessage,
          model: selectedModel,
          api_key: apiKey,
          api_provider: apiProvider
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let assistantMessage = ''
      const assistantMessageId = (Date.now() + 1).toString()
      
      // Add empty assistant message to show loading
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        assistantMessage += chunk

        // Update the assistant message with streaming content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantMessage }
            : msg
        ))
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* PDF Upload Section */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">PDF Document</h3>
          {pdfStatus.pdf_uploaded && (
            <span className="text-sm text-green-600 font-medium">
              ✅ {pdfStatus.chunks_count} chunks loaded
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploadingPDF}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>
          
          {isUploadingPDF && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Processing...</span>
            </div>
          )}
          
          {pdfStatus.pdf_uploaded && (
            <button
              onClick={clearPDF}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Clear PDF
            </button>
          )}
        </div>
        
        {!pdfStatus.pdf_uploaded && (
          <p className="text-sm text-gray-600 mt-2">
            Upload a PDF to enable RAG-powered Q&A. The AI will only answer questions using information from your document.
          </p>
        )}
      </div>

      {/* API Provider and Model Selection */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">AI Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Provider
            </label>
            <select
              value={apiProvider}
              onChange={(e) => {
                const newProvider = e.target.value as 'openai' | 'together'
                console.log('Provider changed to:', newProvider)
                setApiProvider(newProvider)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              disabled={isLoading || isUploadingPDF}
            >
              <option value="openai">OpenAI</option>
              <option value="together">Together AI</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {apiProvider === 'openai' 
                ? 'Use OpenAI\'s GPT models (requires OpenAI API key)'
                : 'Use Together AI\'s open-source models (requires Together API key)'
              }
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                console.log('Model changed to:', e.target.value)
                setSelectedModel(e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              disabled={isLoading || isUploadingPDF}
            >
              {availableModels[apiProvider]?.length > 0 ? (
                availableModels[apiProvider].map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading models...</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Currently using: <span className="font-mono">{selectedModel}</span>
            </p>
          </div>
        </div>

        {/* API Key Info */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>API Key Required:</strong> {apiProvider === 'openai' ? 'OpenAI' : 'Together AI'} API key
            {apiProvider === 'together' && (
              <span className="block mt-1">
                Get your Together API key at <a href="https://api.together.xyz" target="_blank" rel="noopener noreferrer" className="underline">api.together.xyz</a>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">Welcome to RAG-Powered Chat!</p>
            <p className="text-sm">
              {pdfStatus.pdf_uploaded 
                ? 'Your PDF is loaded. Ask questions about its content!'
                : 'Upload a PDF document to get started, or chat normally.'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/•/g, '•')
                      .replace(/\n/g, '<br/>')
                  }}
                />
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex space-x-2">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={pdfStatus.pdf_uploaded ? "Ask a question about your PDF..." : "Type your message here..."}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white text-gray-900 placeholder-gray-500"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
        <button
          onClick={clearChat}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

