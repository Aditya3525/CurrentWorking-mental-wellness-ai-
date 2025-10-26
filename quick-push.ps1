#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick Git Push - One-command sync to GitHub
    
.DESCRIPTION
    Instantly stages, commits, and pushes all changes to GitHub
    
.PARAMETER Message
    Commit message (optional)
    
.EXAMPLE
    .\quick-push.ps1
    
.EXAMPLE
    .\quick-push.ps1 -Message "Added new feature"
#>

param(
    [string]$Message = ""
)

Write-Host "`n[PUSH] Quick Git Push to GitHub" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check for changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[OK] No changes to push. Repository is up to date." -ForegroundColor Green
    exit 0
}

# Count files
$fileCount = ($status | Measure-Object).Count
Write-Host "[INFO] Found $fileCount file(s) with changes" -ForegroundColor Yellow

# Create commit message
if ([string]::IsNullOrWhiteSpace($Message)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Message = "Quick update - $timestamp"
}

# Stage all
Write-Host "`n[STAGE] Staging all changes..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "[COMMIT] Committing: $Message" -ForegroundColor Cyan
git commit -m $Message

# Push
Write-Host "[PUSH] Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Pushed $fileCount file(s) to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/Aditya3525/CurrentWorking-mental-wellness-ai-" -ForegroundColor Gray
}
else {
    Write-Host "`n[ERROR] Push failed. Check errors above." -ForegroundColor Red
    exit 1
}
