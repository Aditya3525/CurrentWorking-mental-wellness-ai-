# Setup Demo Admin User for Mental Wellbeing AI App
# This script creates admin users with the specified credentials

Write-Host "🚀 Mental Wellbeing AI App - Demo Admin Setup" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "backend\scripts\create-demo-admin.ts")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory should contain 'backend\scripts\create-demo-admin.ts'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Setting up in directory: $(Get-Location)" -ForegroundColor Cyan

# Navigate to backend directory
Push-Location backend

try {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing npm packages..." -ForegroundColor Gray
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install npm dependencies"
        }
    } else {
        Write-Host "   Dependencies already installed ✅" -ForegroundColor Green
    }

    Write-Host "🗄️  Setting up database..." -ForegroundColor Yellow
    
    # Check if DATABASE_URL is set
    if (-not $env:DATABASE_URL) {
        Write-Host "   Setting default DATABASE_URL..." -ForegroundColor Gray
        $env:DATABASE_URL = "file:./prisma/dev.db"
    }

    # Generate Prisma client
    Write-Host "   Generating Prisma client..." -ForegroundColor Gray
    npx prisma generate
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to generate Prisma client"
    }

    # Run database migrations
    Write-Host "   Running database migrations..." -ForegroundColor Gray
    npx prisma db push
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to run database migrations"
    }

    Write-Host "👤 Creating demo admin users..." -ForegroundColor Yellow
    
    # Compile and run the TypeScript script
    Write-Host "   Compiling admin setup script..." -ForegroundColor Gray
    npx ts-node scripts/create-demo-admin.ts
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create demo admin users"
    }

    Write-Host ""
    Write-Host "🎉 Demo Admin Setup Complete!" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Admin Login Credentials:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   🔑 Regular Admin:" -ForegroundColor White
    Write-Host "      Email:    admin@wellness.com" -ForegroundColor Yellow
    Write-Host "      Password: Aditya@777" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   🔑 Super Admin:" -ForegroundColor White
    Write-Host "      Email:    superadmin@wellness.com" -ForegroundColor Yellow
    Write-Host "      Password: SuperAdmin@777" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Access admin panel at:" -ForegroundColor Cyan
    Write-Host "   1. Start the application: npm run dev" -ForegroundColor White
    Write-Host "   2. Go to landing page" -ForegroundColor White
    Write-Host "   3. Click 'Admin Access' in footer" -ForegroundColor White
    Write-Host "   4. Login with credentials above" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tips:" -ForegroundColor Cyan
    Write-Host "   - Admin sessions expire after 4 hours" -ForegroundColor Gray
    Write-Host "   - All admin activities are logged" -ForegroundColor Gray
    Write-Host "   - Use super admin for advanced features" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error during setup: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Ensure Node.js is installed (node --version)" -ForegroundColor Gray
    Write-Host "   2. Ensure npm is working (npm --version)" -ForegroundColor Gray
    Write-Host "   3. Check database connection" -ForegroundColor Gray
    Write-Host "   4. Run: npm install (in backend directory)" -ForegroundColor Gray
    Write-Host "   5. Run: npx prisma generate" -ForegroundColor Gray
    Write-Host ""
    exit 1
} finally {
    # Return to original directory
    Pop-Location
}

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green