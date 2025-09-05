# Simple Azure Setup for Mental Wellbeing AI App - Try Different Regions
Write-Host "🚀 Setting up Azure resources for Mental Wellbeing AI App" -ForegroundColor Green

# Variables - trying different regions
$resourceGroup = "mental-wellbeing-ai-rg"
$location = "West US 2"  # Changed from East US
$appServicePlan = "mental-wellbeing-plan"
$backendApp = "mental-wellbeing-backend-$(Get-Random -Minimum 1000 -Maximum 9999)"
$staticApp = "mental-wellbeing-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host "Using location: $location" -ForegroundColor Cyan
Write-Host "Backend app name: $backendApp" -ForegroundColor Cyan
Write-Host "Frontend app name: $staticApp" -ForegroundColor Cyan

Write-Host "`nCreating App Service Plan..." -ForegroundColor Yellow
az appservice plan create --name $appServicePlan --resource-group $resourceGroup --location $location --sku FREE

if ($LASTEXITCODE -eq 0) {
    Write-Host "Creating backend App Service..." -ForegroundColor Yellow
    az webapp create --name $backendApp --resource-group $resourceGroup --plan $appServicePlan --runtime "NODE:18-lts"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend created successfully!" -ForegroundColor Green
        Write-Host "Backend URL: https://$backendApp.azurewebsites.net" -ForegroundColor Cyan
        
        # Configure app settings
        Write-Host "Configuring backend environment..." -ForegroundColor Yellow
        az webapp config appsettings set --name $backendApp --resource-group $resourceGroup --settings NODE_ENV=production
    } else {
        Write-Host "❌ Failed to create backend app service" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to create app service plan" -ForegroundColor Red
}

Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up GitHub Actions for deployment" -ForegroundColor White
Write-Host "2. Configure database (we will use SQLite for now)" -ForegroundColor White
Write-Host "3. Deploy your code" -ForegroundColor White
