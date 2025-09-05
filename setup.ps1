#!/usr/bin/env powershell

Write-Host "🚀 Mental Wellbeing AI App - Environment Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$BackendPath = "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\backend"
$FrontendPath = "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview\frontend"

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

Write-Host "1. Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Setting up Backend Environment..." -ForegroundColor Yellow

# Navigate to backend
Set-Location $BackendPath

# Copy .env.example to .env if it doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Installing Dependencies..." -ForegroundColor Yellow

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
}

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Blue
Set-Location $FrontendPath
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Setting up Database..." -ForegroundColor Yellow

# Go back to backend for database setup
Set-Location $BackendPath

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Blue
npm run db:generate

# Run database migrations
Write-Host "Running database migrations..." -ForegroundColor Blue
npm run migrate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup complete" -ForegroundColor Green
} else {
    Write-Host "❌ Database setup failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Checking AI Provider Setup..." -ForegroundColor Yellow

# Test AI providers
Write-Host "Testing AI providers..." -ForegroundColor Blue
npm run test:ai

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend\.env file to add your API keys:" -ForegroundColor White
Write-Host "   - OPENAI_API_KEY_1=your_openai_key" -ForegroundColor Gray
Write-Host "   - ANTHROPIC_API_KEY_1=your_anthropic_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Install Ollama for local LLM (optional):" -ForegroundColor White
Write-Host "   - Download from https://ollama.ai" -ForegroundColor Gray
Write-Host "   - Run: ollama pull llama3" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the application:" -ForegroundColor White
Write-Host "   Backend:  npm run dev" -ForegroundColor Gray
Write-Host "   Frontend: npm run dev (in new terminal)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Test AI integration:" -ForegroundColor White
Write-Host "   Visit: http://localhost:3000/api/chat/ai/health" -ForegroundColor Gray
Write-Host ""

# Return to original directory
Set-Location "c:\Users\adity\Downloads\Mental Wellbeing AI App Overview"

Write-Host "Happy coding! 🧠✨" -ForegroundColor Magenta
