# AI Chat Frontend

A modern Next.js frontend for the AI Chat Application that integrates with the FastAPI backend.

## Features

- 🤖 Real-time AI chat interface
- 🔑 Secure API key management
- 💬 Streaming responses from OpenAI
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast and efficient with Next.js 14

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Running FastAPI backend (see `/api/README.md`)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

1. **Start the backend first** (in a separate terminal):
   ```bash
   cd api
   pip install -r requirements.txt
   python app.py
   ```

2. **Start the frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser** and go to `http://localhost:3000`

## Usage

1. Enter your OpenAI API key when prompted
2. Optionally customize the system message
3. Start chatting with the AI!

## Development

- **Development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`

## API Integration

The frontend automatically proxies API requests to the backend running on `http://localhost:8000` through Next.js rewrites configured in `next.config.js`.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **HTTP Client**: Fetch API
- **State Management**: React hooks