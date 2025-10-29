Write-Host "Starting scheduler on port 3001..." -ForegroundColor Cyan
$env:SCHEDULER_PORT = "3001"
Write-Host "SCHEDULER_PORT is set to: $env:SCHEDULER_PORT" -ForegroundColor Green
npm run start:scheduler

