'use client'

import { useState, useRef, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import ApiKeyInput from '@/components/ApiKeyInput'

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [isApiKeySet, setIsApiKeySet] = useState(false)

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key)
    setIsApiKeySet(true)
  }

  const handleResetApiKey = () => {
    setApiKey('')
    setIsApiKeySet(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📚 RAG-Powered AI Chat
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Upload PDFs and chat with your documents using OpenAI or Together AI
          </p>
          <p className="text-sm text-gray-500">
            Powered by Retrieval-Augmented Generation (RAG) technology with multi-provider support
          </p>
        </div>

        {!isApiKeySet ? (
          <ApiKeyInput onSubmit={handleApiKeySubmit} />
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6" style={{ minHeight: '80vh' }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    AI Document Chat
                  </h2>
                  <p className="text-sm text-gray-600">
                    Upload a PDF to start document-based conversations, or chat normally
                  </p>
                </div>
                <button
                  onClick={handleResetApiKey}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Change API Key
                </button>
              </div>
              <div className="h-full">
                <ChatInterface apiKey={apiKey} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

