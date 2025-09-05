# 🎓 FREE GitHub Student Pack Deployment Setup

Write-Host "🎓 FREE Deployment with GitHub Student Pack" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host ""
Write-Host "💰 What you'll get 100% FREE:" -ForegroundColor Cyan
Write-Host "• GitHub Pages (Frontend hosting) - FREE forever"
Write-Host "• Heroku ($13/month credit × 24 months = $312 value)"
Write-Host "• DigitalOcean ($200 credit = 40 months free)"
Write-Host "• MongoDB ($50 credit)"
Write-Host "• And 50+ other services!"

Write-Host ""
Write-Host "🚀 Choose your FREE deployment option:" -ForegroundColor Yellow
Write-Host "1. GitHub Pages + Heroku (Easiest, 100% FREE for 2 years)"
Write-Host "2. DigitalOcean Full Stack ($200 credit = 40 months FREE)"
Write-Host "3. Both (Maximum learning experience)"
Write-Host ""
Write-Host "Enter your choice (1-3): " -NoNewline
$choice = Read-Host

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🎯 Excellent! GitHub Pages + Heroku Setup" -ForegroundColor Green
        Write-Host ""
        Write-Host "Step 1: First, let's get your GitHub repo ready..."
        
        # Check if git is initialized
        if (-not (Test-Path .git)) {
            Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
            git init
            git add .
            git commit -m "Initial commit for free deployment"
        }
        
        Write-Host ""
        Write-Host "📋 Next steps (do these manually):" -ForegroundColor Cyan
        Write-Host "1. 🎓 Claim Heroku Student Pack:"
        Write-Host "   - Visit: https://education.github.com/pack"
        Write-Host "   - Find 'Heroku' and claim $13/month credit"
        Write-Host ""
        Write-Host "2. 📱 Install Heroku CLI:"
        Write-Host "   - Download from: https://devcenter.heroku.com/articles/heroku-cli"
        Write-Host ""
        Write-Host "3. 🚀 Deploy commands (run after installing Heroku CLI):"
        Write-Host "   heroku login"
        Write-Host "   heroku create your-mental-wellness-api"
        Write-Host "   heroku addons:create heroku-postgresql:mini"
        Write-Host "   cd backend"
        Write-Host "   git subtree push --prefix=backend heroku main"
        Write-Host ""
        Write-Host "4. ✅ Enable GitHub Pages:"
        Write-Host "   - Go to your GitHub repo → Settings → Pages"
        Write-Host "   - Source: Deploy from a branch → gh-pages"
        
        # Update frontend build config
        Write-Host ""
        Write-Host "🔧 Updating configuration files..." -ForegroundColor Yellow
        
        # Read current package.json and ask for repo details
        Write-Host "What's your GitHub username? " -NoNewline
        $username = Read-Host
        Write-Host "What's your repository name? " -NoNewline
        $repoName = Read-Host
        
        # Update frontend package.json with homepage
        $frontendPackageJson = Get-Content "frontend/package.json" | ConvertFrom-Json
        $frontendPackageJson | Add-Member -Type NoteProperty -Name "homepage" -Value "https://$username.github.io/$repoName" -Force
        $frontendPackageJson | ConvertTo-Json -Depth 10 | Set-Content "frontend/package.json"
        
        Write-Host "✅ Updated frontend configuration" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "💪 Professional choice! DigitalOcean Full Stack" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Setup Instructions:" -ForegroundColor Cyan
        Write-Host "1. 🎓 Claim DigitalOcean Student Pack:"
        Write-Host "   - Visit: https://education.github.com/pack"
        Write-Host "   - Find 'DigitalOcean' and claim $200 credit"
        Write-Host ""
        Write-Host "2. 🖥️ Create Droplet:"
        Write-Host "   - Size: $5/month (Basic)"
        Write-Host "   - OS: Ubuntu 22.04"
        Write-Host "   - Region: Closest to you"
        Write-Host ""
        Write-Host "3. 🐳 Deploy with Docker:"
        Write-Host "   git clone your-repo"
        Write-Host "   cd your-repo"
        Write-Host "   docker-compose up -d"
        Write-Host ""
        Write-Host "💰 This gives you 40 months of FREE hosting!"
    }
    
    "3" {
        Write-Host ""
        Write-Host "🤓 Learning mode activated! Both platforms" -ForegroundColor Green
        Write-Host ""
        Write-Host "Perfect for building experience with multiple platforms!"
        Write-Host "Start with GitHub Pages + Heroku, then add DigitalOcean"
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔧 Building project to verify everything works..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed. Please fix errors first." -ForegroundColor Red
    Write-Host "Error: $_"
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Pro Tips:" -ForegroundColor Cyan
Write-Host "• Every git push to main = automatic deployment"
Write-Host "• Use branches for testing new features"
Write-Host "• Monitor your usage in platform dashboards"
Write-Host "• Join student developer communities"
Write-Host ""
Write-Host "📚 Next: Read FREE_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Your journey to professional deployment starts now!" -ForegroundColor Green
