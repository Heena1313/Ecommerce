## Auto-commit script for Zaalima project
# Place this file at the root of the Zaalima project and run it with PowerShell.
# It will monitor the repository for any changes and create a commit automatically.

# Ensure the script runs from the project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "Auto-commit watcher started in $projectRoot"

while ($true) {
    # Get status of uncommitted changes
    $status = git status --porcelain
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git add -A
        git commit -m "Auto-commit on $timestamp"
        Write-Host "Committed changes at $timestamp"
    }
    # Wait before checking again (30 seconds)
    Start-Sleep -Seconds 30
}
