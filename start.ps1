# CTI Guard - Start Frontend
# Backend is managed by PM2 (auto-starts on Windows login)

Write-Host "`n[CTI Guard] Checking backend..." -ForegroundColor Cyan

# Ensure PM2 backend is running
$status = pm2 list 2>$null | Select-String "cti-backend"
if ($status -match "online") {
    Write-Host "[CTI Guard] Backend already running via PM2 ✓" -ForegroundColor Green
} else {
    Write-Host "[CTI Guard] Resuming backend via PM2..." -ForegroundColor Yellow
    pm2 resurrect
    Start-Sleep -Seconds 2
}

Write-Host "[CTI Guard] Starting frontend at http://localhost:3000 ..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend-react"
npm start
