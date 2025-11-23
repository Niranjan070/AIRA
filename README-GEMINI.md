# AIRA - AI Risk Assessment Platform (Gemini-Powered)

Complete recreation of AIRA platform using Google Gemini API instead of local AI models.

## 📁 Project Structure

```
AIRA/
├── backend-gemini/       # Node.js + Express + Gemini API backend
│   ├── server.js         # Main server with 4 AI agents
│   ├── package.json      # Backend dependencies
│   └── README.md         # Backend setup guide
│
├── frontend-new/         # React + TypeScript + Vite frontend
│   ├── src/              # All source files (76 files)
│   │   ├── pages/        # Dashboard, Workspace, Reports, Agents
│   │   ├── components/   # UI components (58 files)
│   │   ├── contexts/     # AgentContext for state management
│   │   ├── services/     # API service
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript definitions
│   ├── package.json      # Frontend dependencies
│   └── README.md         # Frontend setup guide
│
├── backend/              # [OLD] Python backend (preserved)
└── frontend/             # [OLD] React frontend (preserved)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Google Gemini API key (get from https://aistudio.google.com/apikey)

### 1. Setup Backend (Port 8000)

```powershell
# Navigate to backend
cd d:\AIRA\backend-gemini

# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_api_key_here" > .env
echo "PORT=8000" >> .env

# Install dependencies (already done)
npm install

# Start server
npm start
```

The backend will run at: **http://localhost:8000**

### 2. Setup Frontend (Port 3000)

```powershell
# Open NEW terminal window
cd d:\AIRA\frontend-new

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The frontend will run at: **http://localhost:5173** (Vite default)

### 3. Access Application

Open browser: **http://localhost:5173**

## 🎯 Features

### Backend Features
- ✅ Google Gemini 1.5 Pro API integration
- ✅ 4 specialized AI agents:
  - **Finance Agent**: Cost analysis, ROI, financial impact
  - **Risk Agent**: Risk assessment, success probability
  - **Compliance Agent**: Legal considerations, compliance score
  - **Market Agent**: Market trends, opportunities, sentiment
- ✅ RESTful API endpoints
- ✅ WebSocket support for real-time updates
- ✅ CORS enabled for frontend communication

### Frontend Features
- ✅ Modern React 18 + TypeScript
- ✅ Professional UI with Radix UI components
- ✅ Tailwind CSS for styling
- ✅ 4 main pages:
  - **Dashboard**: KPI metrics, agent status, recent decisions
  - **Workspace**: Analysis interface with scenario input
  - **Reports**: Analysis history with detailed results
  - **Agents**: Individual agent performance tracking
- ✅ State management with Context API
- ✅ LocalStorage persistence
- ✅ Real-time agent status updates
- ✅ Framer Motion animations

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/health` | Health check |
| GET | `/status` | System status |
| POST | `/analyze` | Run analysis with all agents |
| GET | `/analyze/types` | Available analysis types |
| GET | `/examples` | Example scenarios |
| GET | `/system/info` | System information |
| WebSocket | `/ws` | Real-time updates |

## 🔧 Configuration

### Backend Configuration (backend-gemini/.env)
```env
GEMINI_API_KEY=your_api_key_here
PORT=8000
```

### Frontend Configuration
The API base URL is configured in `frontend-new/src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://localhost:8000';
```

## 📊 Usage Example

1. **Start both servers** (backend on :8000, frontend on :5173)
2. **Navigate to Dashboard** - See overview of system
3. **Go to Workspace** - Enter business scenario
4. **Run Analysis** - All 4 agents analyze simultaneously
5. **View Reports** - See detailed results and history
6. **Check Agents page** - Monitor individual agent performance

### Example Scenario:
```
Should we expand our SaaS platform to the European market?
```

### Example Response:
- Finance Agent: Analyzes costs, revenue projections, ROI
- Risk Agent: Identifies expansion risks, success probability
- Compliance Agent: Evaluates GDPR, legal requirements
- Market Agent: Assesses market opportunity, trends

## 🛠️ Development

### Backend Development
```powershell
cd d:\AIRA\backend-gemini
npm run dev  # Auto-restart on changes (if nodemon configured)
```

### Frontend Development
```powershell
cd d:\AIRA\frontend-new
npm run dev  # Hot reload enabled
```

### Build for Production
```powershell
# Frontend build
cd d:\AIRA\frontend-new
npm run build

# Backend runs as-is (Node.js)
cd d:\AIRA\backend-gemini
npm start
```

## 📦 Dependencies

### Backend (backend-gemini)
- `express` - Web framework
- `@google/generative-ai` - Gemini API SDK
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `ws` - WebSocket server

### Frontend (frontend-new)
- `react` - UI framework
- `react-router-dom` - Routing
- `@radix-ui/*` - UI components (50+ components)
- `tailwindcss` - CSS framework
- `framer-motion` - Animations
- `lucide-react` - Icons
- `vite` - Build tool

## 🔍 Troubleshooting

### Backend won't start?
- Check if `.env` file exists with valid `GEMINI_API_KEY`
- Ensure port 8000 is not in use: `Get-Process | Where-Object {$_.Port -eq 8000}`
- Verify npm install completed: `Test-Path "node_modules"`

### Frontend shows API errors?
- Ensure backend is running on port 8000
- Check console for CORS errors
- Verify API_BASE_URL in `services/api.ts`

### Gemini API errors?
- Verify API key is valid
- Check API quota: https://aistudio.google.com/
- Ensure billing is enabled if required

## 📝 Notes

### What Changed from Original?
- **Backend**: Python/FastAPI → Node.js/Express
- **AI Engine**: Local models (Phi-3.5, Mistral, etc.) → Google Gemini API
- **Benefits**:
  - ✅ No GPU required
  - ✅ No 20GB+ model downloads
  - ✅ Faster analysis (cloud-powered)
  - ✅ No .venv environment setup
  - ✅ Simpler deployment

### What Stayed the Same?
- ✅ All frontend features and UI
- ✅ 4 specialized agents
- ✅ Analysis workflow
- ✅ Data persistence
- ✅ Component structure
- ✅ User experience

## 🌐 Environment Variables

### Required
- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional
- `PORT` - Backend port (default: 8000)

## 📄 License

[Your license here]

## 🤝 Contributing

[Your contribution guidelines here]

---

**Built with ❤️ using React, Node.js, and Google Gemini**
