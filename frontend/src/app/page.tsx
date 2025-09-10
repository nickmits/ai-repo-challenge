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
            🤖 AI Chat Application
          </h1>
          <p className="text-lg text-gray-600">
            Powered by OpenAI GPT-4.1-mini
          </p>
        </div>

        {!isApiKeySet ? (
          <ApiKeyInput onSubmit={handleApiKeySubmit} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Chat with AI
                </h2>
                <button
                  onClick={handleResetApiKey}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Change API Key
                </button>
              </div>
              <ChatInterface apiKey={apiKey} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

