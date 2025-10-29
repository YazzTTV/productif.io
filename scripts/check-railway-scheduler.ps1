Write-Host "Verification du deploiement Railway Scheduler..." -ForegroundColor Cyan

# Ouvrir les logs dans le navigateur
$buildUrl = "https://railway.com/project/89788c7f-729b-4bad-8573-f43cebb268e0/service/b75123f6-6db5-41f8-9cc6-6700bb27348a"
Write-Host "`nOuverture du dashboard Railway..." -ForegroundColor Yellow
Start-Process $buildUrl

Write-Host "`nVerifiez dans le dashboard Railway :" -ForegroundColor Green
Write-Host "  1. Le build doit utiliser 'Dockerfile.scheduler'" -ForegroundColor White
Write-Host "  2. Le service doit demarrer avec 'npm run start:scheduler'" -ForegroundColor White
Write-Host "  3. Les logs doivent afficher 'MorningInsightsScheduler demarre'" -ForegroundColor White
Write-Host "`nURL du service: https://scheduler-production-70cc.up.railway.app/health" -ForegroundColor Cyan


