# Simple Azure Setup for Mental Wellbeing AI App
Write-Host "🚀 Setting up Azure resources for Mental Wellbeing AI App" -ForegroundColor Green

# Variables
$resourceGroup = "mental-wellbeing-ai-rg"
$location = "East US"
$appServicePlan = "mental-wellbeing-plan"
$backendApp = "mental-wellbeing-backend"
$staticApp = "mental-wellbeing-frontend"
$dbServer = "mental-wellbeing-db-server"
$dbName = "mental_wellbeing_db"

Write-Host "Creating resource group..." -ForegroundColor Yellow
az group create --name $resourceGroup --location $location

Write-Host "Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create --name $appServicePlan --resource-group $resourceGroup --location $location --sku FREE

Write-Host "Creating backend App Service..." -ForegroundColor Yellow
az webapp create --name $backendApp --resource-group $resourceGroup --plan $appServicePlan --runtime "NODE:18-lts"

Write-Host "Creating Static Web App for frontend..." -ForegroundColor Yellow
az staticwebapp create --name $staticApp --resource-group $resourceGroup --location $location --source "https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-" --branch "main" --app-location "/frontend" --output-location "dist"

Write-Host "✅ Azure resources created successfully!" -ForegroundColor Green
Write-Host "Backend URL: https://$backendApp.azurewebsites.net" -ForegroundColor Cyan
Write-Host "Frontend will be available at: https://$staticApp.azurestaticapps.net" -ForegroundColor Cyan
