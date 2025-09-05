# Alternative Azure Deployment Plan
# Since App Service has region restrictions, let's use a different approach

Write-Host "🚀 Alternative Azure Deployment Setup" -ForegroundColor Green
Write-Host ""

Write-Host "Due to Azure Student subscription restrictions, we'll use:" -ForegroundColor Yellow
Write-Host "✅ 1. Azure Static Web Apps for frontend (no region restrictions)" -ForegroundColor Green
Write-Host "✅ 2. Alternative backend hosting (Railway/Render as backup)" -ForegroundColor Green
Write-Host "✅ 3. GitHub Actions for automatic deployment" -ForegroundColor Green
Write-Host ""

# Let's check what resources we can create
Write-Host "Checking available Azure services..." -ForegroundColor Cyan

# Try creating container instance instead
$containerName = "mental-wellbeing-backend-$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "Trying Azure Container Instance: $containerName" -ForegroundColor Yellow

az container create `
  --resource-group "mental-wellbeing-ai-rg" `
  --name $containerName `
  --image "node:18-alpine" `
  --dns-name-label $containerName `
  --ports 3000 `
  --environment-variables NODE_ENV=production `
  --command-line "echo 'Container ready for deployment'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container Instance created successfully!" -ForegroundColor Green
    Write-Host "Backend URL: http://$containerName.eastus.azurecontainer.io:3000" -ForegroundColor Cyan
} else {
    Write-Host "❌ Container Instance failed. Let's proceed with GitHub Actions setup." -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Next: Set up GitHub Actions for deployment" -ForegroundColor Yellow
