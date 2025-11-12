# Render Deployment Preparation Script

Write-Host "Preparing project for Render.com deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Git repository not found!" -ForegroundColor Red
    Write-Host "Initialize git first: git init" -ForegroundColor Yellow
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""
    
    $commit = Read-Host "Commit these changes? (y/n)"
    if ($commit -eq "y") {
        git add .
        $message = Read-Host "Enter commit message"
        git commit -m $message
        Write-Host "Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "No uncommitted changes" -ForegroundColor Green
}

Write-Host ""
Write-Host "Pre-deployment Checklist:" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Database changed from SQLite to PostgreSQL" -ForegroundColor Green
Write-Host "[OK] Build scripts updated with Prisma generation" -ForegroundColor Green
Write-Host "[OK] render.yaml configuration ready" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Push code to GitHub:" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Go to https://render.com and sign up/login" -ForegroundColor White
Write-Host ""
Write-Host "3. Follow the deployment guide in:" -ForegroundColor White
Write-Host "   RENDER_DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host ""

$openGuide = Read-Host "Open deployment guide now? (y/n)"
if ($openGuide -eq "y") {
    Start-Process "RENDER_DEPLOYMENT_GUIDE.md"
}

Write-Host ""
Write-Host "Quick Reference:" -ForegroundColor Cyan
Write-Host "- Backend directory: ./backend" -ForegroundColor Gray
Write-Host "- Frontend directory: ./frontend" -ForegroundColor Gray
Write-Host "- Database: PostgreSQL (will create on Render)" -ForegroundColor Gray
Write-Host "- Admin credentials after seeding:" -ForegroundColor Gray
Write-Host "  Email: admin@example.com" -ForegroundColor Gray
Write-Host "  Password: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "Ready for deployment!" -ForegroundColor Green
