# AIRA Startup Script - Multi-Model Local GPU Version
# This script starts the Python model server, Node.js backend, and React frontend

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$ModelServerDir = Join-Path $BackendDir "model_server"
$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"

Write-Host "🚀 Starting AIRA - AI Risk Assessment Platform (Multi-Model GPU)" -ForegroundColor Cyan
Write-Host ""

# Check Python venv
if (-not (Test-Path $VenvPython)) {
    Write-Host "❌ ERROR: Python virtual environment not found at .venv\" -ForegroundColor Red
    Write-Host "Run: python -m venv .venv && .\.venv\Scripts\pip.exe install -r backend\model_server\requirements.txt" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Python venv found" -ForegroundColor Green

# Check model server exists
if (-not (Test-Path (Join-Path $ModelServerDir "server.py"))) {
    Write-Host "❌ ERROR: Model server not found at backend\model_server\server.py" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Model server found" -ForegroundColor Green
Write-Host ""

# Start Python model server in new window
Write-Host "🤖 Starting Model Server (Port 8001) - GPU Inference..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; Write-Host '🤖 Model Server Starting (GPU Inference)...' -ForegroundColor Cyan; & '$VenvPython' '$ModelServerDir\server.py'"

# Wait for model server to initialize
Write-Host "⏳ Waiting for model server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Node.js backend in new window
Write-Host "🔧 Starting Backend Server (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Cyan; npm start"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; Write-Host '🎨 Frontend Server Starting...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "✅ All three servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Model Server: http://localhost:8001 (Python + PyTorch + CUDA)" -ForegroundColor Cyan
Write-Host "📍 Backend:      http://localhost:8000 (Node.js + Express)" -ForegroundColor Cyan
Write-Host "📍 Frontend:     http://localhost:5173 (React + Vite)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🤖 Models:" -ForegroundColor Magenta
Write-Host "   Finance    → Phi-3.5 Mini Instruct (3.8B)" -ForegroundColor White
Write-Host "   Risk       → Qwen 2.5 3B Instruct" -ForegroundColor White
Write-Host "   Compliance → Saul 7B Instruct v1" -ForegroundColor White
Write-Host "   Market     → SmolLM2 1.7B Instruct" -ForegroundColor White
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
