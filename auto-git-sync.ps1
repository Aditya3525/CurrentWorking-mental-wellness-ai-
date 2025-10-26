#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automatic Git Sync Script - Watches for file changes and auto-commits/pushes to GitHub
    
.DESCRIPTION
    This script monitors your project directory for changes and automatically:
    1. Stages all changes (git add .)
    2. Commits with timestamp
    3. Pushes to GitHub (origin/main)
    
.PARAMETER WatchInterval
    Seconds between each check for changes (default: 60 seconds)
    
.PARAMETER CommitMessage
    Custom prefix for commit messages (default: "Auto-sync")
    
.EXAMPLE
    .\auto-git-sync.ps1
    
.EXAMPLE
    .\auto-git-sync.ps1 -WatchInterval 30 -CommitMessage "Dev update"
#>

param(
    [int]$WatchInterval = 60,
    [string]$CommitMessage = "Auto-sync"
)

# Colors for better output
$colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    Write-Host "[$Type] $Message" -ForegroundColor $colors[$Type]
}

function Test-GitRepository {
    $gitDir = Join-Path $PWD ".git"
    return Test-Path $gitDir
}

function Get-GitStatus {
    try {
        $status = git status --porcelain 2>&1
        return $status
    }
    catch {
        return $null
    }
}

function Invoke-GitSync {
    param([string]$Message)
    
    try {
        Write-ColorOutput "Checking for changes..." "Info"
        
        $changes = Get-GitStatus
        
        if ([string]::IsNullOrWhiteSpace($changes)) {
            Write-ColorOutput "No changes detected. Repository is up to date." "Success"
            return $true
        }
        
        # Count changes
        $changedFiles = ($changes | Measure-Object).Count
        Write-ColorOutput "Found $changedFiles file(s) with changes" "Warning"
        
        # Stage all changes
        Write-ColorOutput "Staging all changes..." "Info"
        git add . 2>&1 | Out-Null
        
        # Create commit message with timestamp
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $fullMessage = "$Message - $timestamp"
        
        # Commit
        Write-ColorOutput "Committing changes: '$fullMessage'" "Info"
        $commitResult = git commit -m $fullMessage 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Commit failed or no changes to commit" "Warning"
            return $false
        }
        
        # Push to GitHub
        Write-ColorOutput "Pushing to GitHub (origin/main)..." "Info"
        $pushResult = git push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "[OK] Successfully synced to GitHub!" "Success"
            Write-ColorOutput "Pushed $changedFiles file(s)" "Success"
            return $true
        }
        else {
            Write-ColorOutput "Push failed: $pushResult" "Error"
            return $false
        }
    }
    catch {
        Write-ColorOutput "Error during sync: $($_.Exception.Message)" "Error"
        return $false
    }
}

# Main execution
Clear-Host
Write-ColorOutput "==================================================" "Info"
Write-ColorOutput "  Automatic Git Sync to GitHub - STARTED" "Success"
Write-ColorOutput "==================================================" "Info"
Write-ColorOutput "Project: $(Split-Path $PWD -Leaf)" "Info"
Write-ColorOutput "Check Interval: $WatchInterval seconds" "Info"
Write-ColorOutput "Commit Prefix: $CommitMessage" "Info"
Write-ColorOutput "==================================================" "Info"
Write-ColorOutput "" "Info"

# Verify Git repository
if (-not (Test-GitRepository)) {
    Write-ColorOutput "ERROR: Not a Git repository!" "Error"
    Write-ColorOutput "Please run this script from your project root directory." "Error"
    exit 1
}

Write-ColorOutput "Press Ctrl+C to stop the auto-sync watcher" "Warning"
Write-ColorOutput "" "Info"

# Initial sync
Write-ColorOutput "Performing initial sync check..." "Info"
Invoke-GitSync -Message $CommitMessage
Write-ColorOutput "" "Info"

# Continuous monitoring
$iteration = 1
while ($true) {
    Write-ColorOutput "----------------------------------------" "Info"
    Write-ColorOutput "Check #$iteration - $(Get-Date -Format 'HH:mm:ss')" "Info"
    
    Invoke-GitSync -Message $CommitMessage
    
    Write-ColorOutput "Next check in $WatchInterval seconds..." "Info"
    Write-ColorOutput "" "Info"
    
    Start-Sleep -Seconds $WatchInterval
    $iteration++
}
