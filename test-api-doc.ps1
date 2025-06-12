# Test des API selon la documentation productif.io
# Script basé sur la documentation officielle docs/api-tokens.md

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl0.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"

Write-Host "=== Tests API productif.io selon la documentation ===" -ForegroundColor Green
Write-Host ""

# Test 1: Vérification du token (selon doc)
Write-Host "1. Test du token avec /api/test-token" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://productif.io/api/test-token" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Token valide !" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Erreur test token: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response.StatusCode) - $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
}

Write-Host "`n" + "="*50 + "`n"

# Test 2: IDs rapides (selon doc - endpoint recommandé pour débuter)
Write-Host "2. Récupération des IDs rapides avec /api/debug/quick-ids" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://productif.io/api/debug/quick-ids" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ IDs récupérés !" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Erreur IDs rapides: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response.StatusCode) - $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
}

Write-Host "`n" + "="*50 + "`n"

# Test 3: Tâches du jour (endpoint correct selon doc)
Write-Host "3. Récupération des tâches du jour avec /api/agent/tasks/today" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://productif.io/api/agent/tasks/today" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Tâches du jour récupérées !" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Erreur tâches du jour: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response.StatusCode) - $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
}

Write-Host "`n" + "="*50 + "`n"

# Test 4: Habitudes avec historique (endpoint recommandé selon doc)
Write-Host "4. Récupération des habitudes avec /api/habits/agent" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://productif.io/api/habits/agent" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Habitudes récupérées !" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Erreur habitudes: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Response.StatusCode) - $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
}

Write-Host "`n" + "="*50 + "`n"
Write-Host "=== Tests terminés ===" -ForegroundColor Green 