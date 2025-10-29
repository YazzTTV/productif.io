# Script de test du scheduler local
Write-Host "🧪 Test du scheduler sur le port 3001..." -ForegroundColor Cyan

# Attendre que le service démarre
Write-Host "⏳ Attente de démarrage (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Tester le healthcheck
Write-Host "`n📊 Vérification du healthcheck..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
    Write-Host "✅ Healthcheck OK:" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 3
    
    # Tester le status
    Write-Host "`n📈 Vérification du status..." -ForegroundColor Cyan
    $status = Invoke-RestMethod -Uri "http://localhost:3001/status" -Method Get
    Write-Host "✅ Status OK:" -ForegroundColor Green
    $status | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "❌ Erreur de connexion au scheduler:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "`n💡 Vérifiez que le scheduler est bien démarré sur le port 3001" -ForegroundColor Yellow
}

