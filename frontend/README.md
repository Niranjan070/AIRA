# 🚀 Four Pillars AI - Frontend (New)

**React + Vite + TypeScript frontend connected to Gemini API backend**

## 📦 Quick Setup

### 1. Install Dependencies
```powershell
cd D:\AIRA\frontend-new
npm install
```

### 2. Copy UI Components from Original
Since we have 76+ UI component files, copy them from the original:

```powershell
# Copy all UI components
xcopy D:\AIRA\frontend\src\components D:\AIRA\frontend-new\src\components /E /I /H

# Copy assets
xcopy D:\AIRA\frontend\src\assets D:\AIRA\frontend-new\src\assets /E /I /H
```

### 3. Update API Endpoint
The API is already configured to use `http://localhost:8000` (backend-gemini)

### 4. Run Development Server
```powershell
npm run dev
```

Visit: http://localhost:5173

## 🔗 Connect to Backend

Make sure backend-gemini is running:
```powershell
cd D:\AIRA\backend-gemini
npm start
```

## 📁 Project Structure

```
frontend-new/
├── src/
│   ├── components/     # UI components (copy from original)
│   ├── contexts/       # Agent context
│   ├── pages/          # Dashboard, Workspace, Reports, Agents
│   ├── services/       # API service
│   ├── hooks/          # Custom hooks
│   ├── types/          # TypeScript types
│   ├── data/           # Mock data
│   └── App.tsx         # Main app component
├── index.html
├── package.json
└── vite.config.ts
```

## ✅ What's Included

- ✅ All pages: Dashboard, Workspace, Reports, Agents
- ✅ Agent Context with localStorage persistence
- ✅ API service connected to backend-gemini
- ✅ Real-time analysis updates
- ✅ Same UI/UX as original

## 🎯 Features

- Executive Dashboard with KPI metrics
- Analysis Workspace with 4 AI agents
- Strategic Reports history
- Agent Management
- Real-time backend connection status
- localStorage data persistence

---

**Copy the components from original frontend to complete the setup!**
