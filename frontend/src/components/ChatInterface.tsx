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

export default function ChatInterface({ apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [developerMessage, setDeveloperMessage] = useState(`You are a helpful AI assistant with specialized formatting rules:

MATHEMATICAL PROBLEMS: Provide only the final answer with a brief 1-sentence explanation. Format: "Answer: [result]. [Brief explanation]"

REPHRASING/REWRITING: Structure responses professionally with clear sections, proper grammar, and logical flow.

SUMMARIZATION: Use **bold** for key points and bullet points (•) for semantic keys. Format:
• **Key Point 1**: Brief explanation
• **Key Point 2**: Brief explanation

For other questions, provide helpful, well-structured responses.`)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
          model: 'gpt-4.1-mini',
          api_key: apiKey
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
    <div className="flex flex-col h-96">
      {/* Developer Message Input */}
      <div className="mb-4">
        <label htmlFor="developerMessage" className="block text-sm font-medium text-gray-700 mb-2">
          AI Response Style
        </label>
        
        {/* Preset Style Buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => setDeveloperMessage(`You are a helpful AI assistant with specialized formatting rules:

MATHEMATICAL PROBLEMS: Provide only the final answer with a brief 1-sentence explanation. Format: "Answer: [result]. [Brief explanation]"

REPHRASING/REWRITING: Structure responses professionally with clear sections, proper grammar, and logical flow.

SUMMARIZATION: Use **bold** for key points and bullet points (•) for semantic keys. Format:
• **Key Point 1**: Brief explanation
• **Key Point 2**: Brief explanation

For other questions, provide helpful, well-structured responses.`)}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Smart Formatting
          </button>
          
          <button
            type="button"
            onClick={() => setDeveloperMessage(`You are a helpful AI assistant. For mathematical problems, provide only the answer with a brief explanation. For summaries, use bullet points and bold text for key points. For rephrasing, maintain professional structure.`)}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Concise
          </button>
          
          <button
            type="button"
            onClick={() => setDeveloperMessage(`You are a helpful AI assistant.`)}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          >
            Default
          </button>
        </div>
        
        <textarea
          id="developerMessage"
          value={developerMessage}
          onChange={(e) => setDeveloperMessage(e.target.value)}
          placeholder="Customize AI response formatting rules..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 placeholder-gray-500 resize-none"
          rows={4}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with the AI!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
          placeholder="Type your message here..."
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

