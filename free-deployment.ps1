# 🚀 Quick Free Deployment Setup
Write-Host "Setting up FREE hosting deployment for Mental Wellbeing AI App" -ForegroundColor Green

Write-Host "`n📋 What we're setting up:" -ForegroundColor Yellow
Write-Host "✅ Frontend: Vercel (Free)" -ForegroundColor Green
Write-Host "✅ Backend: Railway (Free $5/month credit)" -ForegroundColor Green
Write-Host "✅ Database: Railway PostgreSQL (Free)" -ForegroundColor Green

Write-Host "`n🔗 Go to these websites to deploy:" -ForegroundColor Cyan
Write-Host "1. Frontend → https://vercel.com/new" -ForegroundColor White
Write-Host "2. Backend → https://railway.app/new" -ForegroundColor White

Write-Host "`n📂 Your GitHub repository:" -ForegroundColor Cyan
Write-Host "https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-" -ForegroundColor White

Write-Host "`n⚙️ Vercel Settings:" -ForegroundColor Yellow
Write-Host "• Framework: Vite" -ForegroundColor White
Write-Host "• Root Directory: frontend" -ForegroundColor White
Write-Host "• Build Command: npm run build" -ForegroundColor White
Write-Host "• Output Directory: dist" -ForegroundColor White

Write-Host "`n⚙️ Railway Settings:" -ForegroundColor Yellow
Write-Host "• Root Directory: backend" -ForegroundColor White
Write-Host "• Start Command: npm start" -ForegroundColor White
Write-Host "• Add PostgreSQL database after deployment" -ForegroundColor White

Write-Host "`n🎯 Benefits:" -ForegroundColor Green
Write-Host "• Automatic deployments on every GitHub push" -ForegroundColor White
Write-Host "• Custom domains available" -ForegroundColor White
Write-Host "• Environment variables support" -ForegroundColor White
Write-Host "• SSL certificates included" -ForegroundColor White

Write-Host "`n📖 Read FREE_HOSTING_GUIDE.md for detailed instructions" -ForegroundColor Cyan

# Open the deployment websites
Write-Host "`nOpening deployment websites..." -ForegroundColor Yellow
Start-Process "https://vercel.com/new"
Start-Process "https://railway.app/new"
Start-Process "https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-"
