# AIRA - AI Risk Assessment Platform

A multi-agent AI system powered by Google Gemini for comprehensive business risk analysis across financial, legal, market, and social domains.

## Features

- **Multi-Agent Analysis** - Specialized AI agents for Finance, Legal, Market, and Social risk assessment
- **Real-time Collaboration** - WebSocket-based agent interaction and consensus building
- **Data-Driven Insights** - Integrated datasets for financial, legal, market, and social sectors
- **Interactive Dashboard** - Modern React UI with real-time analysis visualization

## Tech Stack

**Backend:**
- Node.js + Express
- Google Gemini AI (2.5 Flash)
- WebSocket for real-time communication
- CSV/JSON data processing

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Radix UI components

## Quick Start

1. **Setup Environment**
   ```bash
   cd backend
   cp .env.example .env
   # Add your GEMINI_API_KEY
   ```

2. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Run Application**
   ```bash
   # Option 1: Use startup script
   .\start-aira.ps1
   
   # Option 2: Manual start
   cd backend && npm start
   cd frontend && npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

## Project Structure

```
AIRA/
├── backend/          # Express API server
│   ├── datasets/     # Financial, legal, market, social data
│   ├── server.js     # Main server with agent logic
│   └── dataLoader.js # Dataset processing
├── frontend/         # React application
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
└── start-aira.ps1   # Quick startup script
```

## API Key

Get your free Gemini API key: https://aistudio.google.com/apikey

