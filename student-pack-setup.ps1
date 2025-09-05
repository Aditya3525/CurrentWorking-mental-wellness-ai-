# 🎓 GitHub Student Pack Deployment Setup

Write-Host "🎓 GitHub Student Pack - Premium Deployment Setup" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 With GitHub Student Pack, you get:" -ForegroundColor Cyan
Write-Host "• Vercel Pro (FREE - normally $20/month)"
Write-Host "• PlanetScale (FREE - normally $29/month)"
Write-Host "• DigitalOcean ($200 credit)"
Write-Host "• Azure ($100 credit)"
Write-Host "• Heroku (Extended free tier)"
Write-Host "• And many more!"

Write-Host ""
Write-Host "📋 Pre-requisites Check:" -ForegroundColor Yellow

# Check if user has GitHub Student Pack
Write-Host "1. Do you have GitHub Student Pack activated? (Y/N): " -NoNewline
$hasStudentPack = Read-Host

if ($hasStudentPack -ne "Y" -and $hasStudentPack -ne "y") {
    Write-Host ""
    Write-Host "❌ Please activate GitHub Student Pack first:" -ForegroundColor Red
    Write-Host "   Visit: https://education.github.com/pack"
    Write-Host "   Verify your student status"
    Write-Host "   Then run this script again"
    exit 1
}

# Check Node.js version
$nodeVersion = node --version
Write-Host "2. Node.js Version: $nodeVersion" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "🎯 Choose your deployment stack:" -ForegroundColor Cyan
Write-Host "1. Vercel Pro + PlanetScale (Recommended) ⭐⭐⭐"
Write-Host "2. Netlify Pro + Railway"
Write-Host "3. DigitalOcean + PostgreSQL"
Write-Host "4. Azure (Full Microsoft Stack)"
Write-Host ""
Write-Host "Enter your choice (1-4): " -NoNewline
$choice = Read-Host

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🏆 Excellent choice! Vercel Pro + PlanetScale" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Setup Instructions:" -ForegroundColor Cyan
        Write-Host "1. Claim Vercel Pro: https://vercel.com/github-students"
        Write-Host "2. Claim PlanetScale: https://planetscale.com/github-students"
        Write-Host "3. Copy schema-planetscale.prisma to schema.prisma"
        Write-Host "4. Use .env.production-planetscale for environment variables"
        Write-Host ""
        
        # Copy PlanetScale schema
        Copy-Item "backend/schema-planetscale.prisma" "backend/prisma/schema.prisma" -Force
        Write-Host "✅ Updated Prisma schema for PlanetScale" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "🔑 Environment Variables to set in Vercel:" -ForegroundColor Yellow
        Get-Content "backend/.env.production-planetscale"
    }
    "2" {
        Write-Host ""
        Write-Host "🌟 Great choice! Netlify Pro + Railway" -ForegroundColor Green
        Write-Host "📋 Setup Instructions:" -ForegroundColor Cyan
        Write-Host "1. Claim Netlify Pro: https://netlify.com/github-students"
        Write-Host "2. Claim Railway credits: https://railway.app/github-student"
        Write-Host "3. Follow DEPLOYMENT_NETLIFY_RAILWAY.md"
    }
    "3" {
        Write-Host ""
        Write-Host "💪 Power user choice! DigitalOcean" -ForegroundColor Green
        Write-Host "📋 Setup Instructions:" -ForegroundColor Cyan
        Write-Host "1. Claim $200 credit: https://digitalocean.com/github-students"
        Write-Host "2. Create Droplet (Ubuntu 22.04)"
        Write-Host "3. Use Docker setup (docker-compose.yml)"
    }
    "4" {
        Write-Host ""
        Write-Host "🏢 Enterprise choice! Microsoft Azure" -ForegroundColor Green
        Write-Host "📋 Setup Instructions:" -ForegroundColor Cyan
        Write-Host "1. Claim $100 credit: https://azure.microsoft.com/students"
        Write-Host "2. Use Azure App Service + Azure Database"
        Write-Host "3. Full Microsoft ecosystem"
    }
    default {
        Write-Host "❌ Invalid choice. Please run script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💰 Total Value with Student Pack: $600+/year FREE!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Read GITHUB_STUDENT_DEPLOYMENT.md for detailed instructions"
Write-Host "2. Set up your chosen services using Student Pack benefits"
Write-Host "3. Configure environment variables"
Write-Host "4. Deploy and enjoy your FREE premium hosting!"
Write-Host ""
Write-Host "🎓 You're getting professional-grade hosting for FREE!" -ForegroundColor Green
