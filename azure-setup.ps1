# 🚀 Microsoft Azure Deployment Setup Script

Write-Host "🚀 Microsoft Azure Deployment Setup" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

Write-Host ""
Write-Host "💎 Azure with GitHub Student Pack gives you:" -ForegroundColor Cyan
Write-Host "• $100 FREE Azure credit"
Write-Host "• FREE App Service (Backend hosting)"
Write-Host "• FREE Static Web Apps (Frontend hosting)"
Write-Host "• FREE PostgreSQL Database"
Write-Host "• FREE SSL certificates"
Write-Host "• Professional monitoring and analytics"
Write-Host "• Resume-boosting Microsoft experience"

Write-Host ""
Write-Host "📋 Prerequisites Check:" -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version
Write-Host "✅ Node.js Version: $nodeVersion" -ForegroundColor Green

# Check if Azure CLI is installed
try {
    $azVersion = az --version 2>$null
    if ($azVersion) {
        Write-Host "✅ Azure CLI is already installed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Azure CLI not found" -ForegroundColor Red
    Write-Host "📥 Installing Azure CLI..." -ForegroundColor Yellow
    
    # Install Azure CLI using winget
    try {
        winget install Microsoft.AzureCLI
        Write-Host "✅ Azure CLI installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Azure CLI automatically" -ForegroundColor Red
        Write-Host "Please install manually from: https://aka.ms/installazurecliwindows"
        Write-Host "Then run this script again."
        exit 1
    }
}

Write-Host ""
Write-Host "🎓 Step 1: Claim Your Azure Student Benefits" -ForegroundColor Cyan
Write-Host "Go to one of these links:"
Write-Host "• Azure for Students: https://azure.microsoft.com/students"
Write-Host "• GitHub Student Pack: https://education.github.com/pack (find Microsoft Azure)"
Write-Host ""
Write-Host "Have you claimed your Azure Student benefits? (Y/N): " -NoNewline
$claimed = Read-Host

if ($claimed -ne "Y" -and $claimed -ne "y") {
    Write-Host ""
    Write-Host "⚠️  Please claim your Azure benefits first, then run this script again." -ForegroundColor Yellow
    Write-Host "You get $100 FREE credit + additional free services!"
    exit 0
}

Write-Host ""
Write-Host "🔑 Step 2: Azure Login" -ForegroundColor Cyan
Write-Host "Opening Azure login page..."

try {
    az login
    Write-Host "✅ Successfully logged into Azure" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure login failed" -ForegroundColor Red
    Write-Host "Please try: az login"
    exit 1
}

Write-Host ""
Write-Host "📝 Step 3: Project Configuration" -ForegroundColor Cyan

Write-Host "What's your GitHub username? " -NoNewline
$githubUsername = Read-Host

Write-Host "What's your repository name? " -NoNewline
$repoName = Read-Host

Write-Host "What's your preferred Azure region? (default: East US) " -NoNewline
$region = Read-Host
if (-not $region) { $region = "East US" }

# Generate resource names
$resourceGroup = "mental-wellness-rg"
$frontendName = "mental-wellness-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)"
$backendName = "mental-wellness-api-$(Get-Random -Minimum 1000 -Maximum 9999)"
$dbName = "mental-wellness-db-$(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host ""
Write-Host "🏗️  Step 4: Creating Azure Resources" -ForegroundColor Cyan

Write-Host "Creating resource group..." -ForegroundColor Yellow
try {
    az group create --name $resourceGroup --location $region
    Write-Host "✅ Resource group created: $resourceGroup" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

Write-Host "Creating App Service plan..." -ForegroundColor Yellow
try {
    az appservice plan create --name "mental-wellness-plan" --resource-group $resourceGroup --sku FREE --is-linux
    Write-Host "✅ App Service plan created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create App Service plan" -ForegroundColor Red
}

Write-Host "Creating backend App Service..." -ForegroundColor Yellow
try {
    az webapp create --name $backendName --resource-group $resourceGroup --plan "mental-wellness-plan" --runtime "NODE:18-lts"
    Write-Host "✅ Backend App Service created: $backendName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create App Service" -ForegroundColor Red
}

Write-Host "Creating Static Web App for frontend..." -ForegroundColor Yellow
try {
    # Note: This requires the staticwebapp extension
    az extension add --name staticwebapp 2>$null
    az staticwebapp create --name $frontendName --resource-group $resourceGroup --source "https://github.com/$githubUsername/$repoName" --location "East US2" --branch main --app-location "/frontend" --output-location "dist"
    Write-Host "✅ Static Web App created: $frontendName" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Static Web App creation requires GitHub authentication" -ForegroundColor Yellow
    Write-Host "Please create it manually in Azure Portal or use Azure CLI with GitHub token"
}

Write-Host ""
Write-Host "🗄️  Step 5: Database Setup" -ForegroundColor Cyan

Write-Host "Enter a secure password for the database admin: " -NoNewline
$dbPassword = Read-Host -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

Write-Host "Creating PostgreSQL database..." -ForegroundColor Yellow
try {
    az postgres flexible-server create --resource-group $resourceGroup --name $dbName --location $region --admin-user dbadmin --admin-password $dbPasswordPlain --sku-name Standard_B1ms --tier Burstable --version 14 --storage-size 32
    
    # Create the database
    az postgres flexible-server db create --resource-group $resourceGroup --server-name $dbName --database-name mental_wellbeing_db
    
    Write-Host "✅ PostgreSQL database created: $dbName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create database" -ForegroundColor Red
    Write-Host "You can create it manually in Azure Portal"
}

Write-Host ""
Write-Host "⚙️  Step 6: Environment Variables" -ForegroundColor Cyan

# Construct database URL
$databaseUrl = "postgresql://dbadmin:$dbPasswordPlain@$dbName.postgres.database.azure.com:5432/mental_wellbeing_db?sslmode=require"

Write-Host "Enter your Gemini API key (optional): " -NoNewline
$geminiKey = Read-Host

Write-Host "Enter your OpenAI API key (optional): " -NoNewline
$openaiKey = Read-Host

Write-Host "Configuring backend environment variables..." -ForegroundColor Yellow
try {
    $settings = @(
        "NODE_ENV=production"
        "JWT_SECRET=$(New-Guid)"
        "DATABASE_URL=$databaseUrl"
        "FRONTEND_URL=https://$frontendName.azurestaticapps.net"
        "AI_PROVIDER_PRIORITY=gemini,openai,anthropic"
        "AI_MAX_TOKENS=150"
        "AI_TEMPERATURE=0.7"
    )
    
    if ($geminiKey) { $settings += "GEMINI_API_KEY_1=$geminiKey" }
    if ($openaiKey) { $settings += "OPENAI_API_KEY_1=$openaiKey" }
    
    az webapp config appsettings set --name $backendName --resource-group $resourceGroup --settings $settings
    Write-Host "✅ Backend environment variables configured" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set environment variables" -ForegroundColor Red
}

Write-Host ""
Write-Host "📦 Step 7: Preparing Deployment Files" -ForegroundColor Cyan

# Create Azure-specific files
Write-Host "Creating Azure deployment files..." -ForegroundColor Yellow

# Create web.config for Azure App Service
$webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="dist/server.js" verb="*" modules="iisnode"/>
    </handlers>
    <rewrite>
      <rules>
        <rule name="DynamicContent">
          <match url="/*" />
          <action type="Rewrite" url="dist/server.js"/>
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@

$webConfig | Out-File -FilePath "backend/web.config" -Encoding utf8

# Update frontend environment
$frontendEnv = "VITE_API_URL=https://$backendName.azurewebsites.net/api"
$frontendEnv | Out-File -FilePath "frontend/.env.production" -Encoding utf8

Write-Host "✅ Deployment files created" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Your Azure Resources:" -ForegroundColor Cyan
Write-Host "• Resource Group: $resourceGroup"
Write-Host "• Frontend URL: https://$frontendName.azurestaticapps.net"
Write-Host "• Backend URL: https://$backendName.azurewebsites.net"
Write-Host "• Database: $dbName.postgres.database.azure.com"

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Push your code to GitHub"
Write-Host "2. Set up GitHub Actions for automated deployment"
Write-Host "3. Configure custom domain (optional)"
Write-Host "4. Monitor your app in Azure Portal"

Write-Host ""
Write-Host "📚 Useful Commands:" -ForegroundColor Cyan
Write-Host "• View logs: az webapp log tail --name $backendName --resource-group $resourceGroup"
Write-Host "• Restart app: az webapp restart --name $backendName --resource-group $resourceGroup"
Write-Host "• Azure Portal: https://portal.azure.com"

Write-Host ""
Write-Host "💡 Your Mental Wellbeing AI App is now ready for Azure deployment!" -ForegroundColor Green
Write-Host "Read AZURE_DEPLOYMENT_GUIDE.md for detailed instructions and troubleshooting." -ForegroundColor Yellow
