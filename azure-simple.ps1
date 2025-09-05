Write-Host "Setting up Azure resources for Mental Wellbeing AI App" -ForegroundColor Green

$resourceGroup = "mental-wellbeing-ai-rg"
$location = "West US 2"
$appServicePlan = "mental-wellbeing-plan"
$backendApp = "mental-wellbeing-backend-$(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host "Using location: $location" -ForegroundColor Cyan
Write-Host "Backend app name: $backendApp" -ForegroundColor Cyan

Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create --name $appServicePlan --resource-group $resourceGroup --location $location --sku FREE

Write-Host "Creating backend App Service..." -ForegroundColor Yellow
az webapp create --name $backendApp --resource-group $resourceGroup --plan $appServicePlan --runtime "NODE:18-lts"

Write-Host "Configuring backend environment..." -ForegroundColor Yellow
az webapp config appsettings set --name $backendApp --resource-group $resourceGroup --settings NODE_ENV=production

Write-Host "Backend URL: https://$backendApp.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
