# 🚀 Four Pillars AI - Gemini API Backend

**Cloud-powered Node.js backend using Google Gemini API**

## 📋 Overview

This is a simplified, cloud-based version of the Four Pillars AI backend that uses Google's Gemini API instead of local AI models. No GPU or heavy downloads required!

## ✨ Features

- ✅ **No Local Models** - Uses Gemini API (no 20GB+ downloads)
- ✅ **Fast Startup** - Runs in seconds, not minutes
- ✅ **Low Memory** - Uses < 100MB RAM vs 16GB+ for local models
- ✅ **Same Endpoints** - Compatible with original frontend
- ✅ **4 AI Agents** - Finance, Risk, Compliance, Market analysis
- ✅ **WebSocket Support** - Real-time analysis updates

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Google Gemini 1.5 Pro** - AI model (via API)
- **WebSocket** - Real-time communication

## 📦 Setup

### Prerequisites

- Node.js 18+ installed
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. **Navigate to backend folder:**
   ```powershell
   cd D:\AIRA\backend-gemini
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Create .env file:**
   ```powershell
   copy .env.example .env
   ```

4. **Edit .env and add your Gemini API key:**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=8000
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start the server:**
   ```powershell
   npm start
   ```

   Or for development with auto-reload:
   ```powershell
   npm run dev
   ```

## 🎯 API Endpoints

### GET /
API information and available endpoints

### GET /health
Health check status

### GET /status  
Detailed system status with all agents

### POST /analyze
Run business analysis
```json
{
  "scenario": "Your business scenario here",
  "analysis_focus": "comprehensive"
}
```

**analysis_focus options:**
- `comprehensive` - All 4 agents
- `financial` - Finance agent only
- `risk` - Risk agent only
- `compliance` - Compliance agent only
- `market` - Market agent only

### GET /analyze/types
Get all analysis types with descriptions

### GET /examples
Get example business scenarios

### GET /system/info
Get detailed system information

### WebSocket /ws
Real-time analysis updates

## 🧪 Testing

Test the API with curl:

```powershell
# Health check
curl http://localhost:8000/health

# Run analysis
curl -X POST http://localhost:8000/analyze `
  -H "Content-Type: application/json" `
  -d '{\"scenario\": \"A startup building an AI chatbot for customer service\", \"analysis_focus\": \"comprehensive\"}'
```

## 📊 Performance

| Analysis Type | Duration | Memory | Cost |
|---------------|----------|--------|------|
| Comprehensive | 30-60s | ~50MB | ~4 API calls |
| Single Agent | 10-20s | ~50MB | ~1 API call |

## 💰 Gemini API Pricing

- **Free Tier**: 15 requests/minute, 1500 requests/day
- **Paid**: $0.0005 per 1K characters input, $0.0015 per 1K characters output

## 🔗 Connect to Frontend

Update your frontend API base URL to:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

## 🚀 Deployment

Deploy to any Node.js hosting:
- **Railway**: One-click deploy
- **Render**: Free tier available
- **Vercel**: Serverless functions
- **Heroku**: Classic PaaS

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| GEMINI_API_KEY | Your Gemini API key | Yes |
| PORT | Server port (default: 8000) | No |
| CORS_ORIGIN | Allowed frontend origin | No |
| NODE_ENV | Environment (development/production) | No |

## 🆚 vs Original Backend

| Feature | Original (Python) | This (Node.js + Gemini) |
|---------|-------------------|-------------------------|
| Setup Time | 30+ minutes | 2 minutes |
| Dependencies | 20GB+ models | 50MB node_modules |
| Memory | 16GB+ RAM | < 100MB RAM |
| GPU Required | Yes (RTX 4050) | No |
| Response Quality | Good (local 7B models) | Excellent (Gemini 1.5 Pro) |
| Cost | Free (but hardware intensive) | Pay-per-use (generous free tier) |
| Startup Time | 2-5 minutes | < 1 second |

## 🛟 Troubleshooting

**"Missing API key" error:**
- Make sure you created `.env` file
- Add valid Gemini API key
- Restart the server

**CORS errors:**
- Check CORS_ORIGIN matches your frontend URL
- Default is http://localhost:5173

**Slow responses:**
- Gemini API may have rate limits
- Check your API quota in Google AI Studio
- Consider upgrading to paid tier for production

## 📚 Learn More

- [Gemini API Docs](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Express.js Guide](https://expressjs.com/)

---

**Built with ❤️ using Node.js and Google Gemini API**
