# 🚀 Quick Deployment Setup Script

Write-Host "🚀 Mental Wellbeing AI App - Deployment Setup" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit for deployment"
}

# Check Node.js version
$nodeVersion = node --version
Write-Host "📋 Node.js Version: $nodeVersion" -ForegroundColor Cyan

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps for Deployment:" -ForegroundColor Cyan
Write-Host "1. Push your code to GitHub:"
Write-Host "   git remote add origin https://github.com/yourusername/your-repo-name.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "2. Choose a deployment platform:"
Write-Host "   • Vercel (Recommended): https://vercel.com"
Write-Host "   • Netlify + Railway: https://netlify.com + https://railway.app"
Write-Host ""
Write-Host "3. Set up your database:"
Write-Host "   • Neon (Recommended): https://neon.tech"
Write-Host "   • Supabase: https://supabase.com"
Write-Host ""
Write-Host "4. Configure environment variables in your deployment platform"
Write-Host ""
Write-Host "📖 Read DEPLOYMENT_GUIDE.md for detailed instructions!" -ForegroundColor Green
