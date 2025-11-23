# AIRA Startup Script - Gemini Version
# This script starts both backend and frontend servers

Write-Host "🚀 Starting AIRA - AI Risk Assessment Platform (Gemini-Powered)" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists in backend
if (-not (Test-Path "d:\AIRA\backend-gemini\.env")) {
    Write-Host "❌ ERROR: .env file not found in backend-gemini!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create d:\AIRA\backend-gemini\.env with:" -ForegroundColor Yellow
    Write-Host "GEMINI_API_KEY=your_api_key_here" -ForegroundColor Yellow
    Write-Host "PORT=8000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your API key from: https://aistudio.google.com/apikey" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Start backend in new window
Write-Host "🔧 Starting Backend Server (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\AIRA\backend-gemini'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Cyan; npm start"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\AIRA\frontend-new'; Write-Host '🎨 Frontend Server Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🌐 Opening application in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✅ AIRA is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "To stop servers:" -ForegroundColor Yellow
Write-Host "  - Close the PowerShell windows OR" -ForegroundColor Yellow
Write-Host "  - Press Ctrl+C in each window" -ForegroundColor Yellow
Write-Host ""
