# Script de test pour toutes les APIs productif.io
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl19.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"
$baseUrl = "https://productif.io"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "🔧 Test du token API..." -ForegroundColor Green
try {
    $testResult = Invoke-RestMethod -Uri "$baseUrl/api/test-token" -Method Get -Headers $headers
    Write-Host "✅ Token valide!" -ForegroundColor Green
    Write-Host ($testResult | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur test token: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Récupération de tous les IDs..." -ForegroundColor Green
try {
    $allIds = Invoke-RestMethod -Uri "$baseUrl/api/debug/ids" -Method Get -Headers $headers
    Write-Host "✅ Tous les IDs récupérés!" -ForegroundColor Green
    Write-Host ($allIds | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur tous les IDs: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n⚡ Récupération des IDs rapides..." -ForegroundColor Green
try {
    $quickIds = Invoke-RestMethod -Uri "$baseUrl/api/debug/quick-ids" -Method Get -Headers $headers
    Write-Host "✅ IDs rapides récupérés!" -ForegroundColor Green
    Write-Host ($quickIds | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur IDs rapides: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test des tâches..." -ForegroundColor Green
$today = Get-Date -Format "yyyy-MM-dd"
try {
    $todayTasks = Invoke-RestMethod -Uri "$baseUrl/api/tasks/agent/date?date=$today" -Method Get -Headers $headers
    Write-Host "✅ Tâches du jour récupérées!" -ForegroundColor Green
    Write-Host ($todayTasks | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur tâches du jour: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Test des habitudes..." -ForegroundColor Green
try {
    $habits = Invoke-RestMethod -Uri "$baseUrl/api/habits/agent" -Method Get -Headers $headers
    Write-Host "✅ Habitudes récupérées!" -ForegroundColor Green
    Write-Host ($habits | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur habitudes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n⚙️ Test des processus..." -ForegroundColor Green
try {
    $processes = Invoke-RestMethod -Uri "$baseUrl/api/processes/agent" -Method Get -Headers $headers
    Write-Host "✅ Processus récupérés!" -ForegroundColor Green
    Write-Host ($processes | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur processus: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Test des objectifs OKR..." -ForegroundColor Green
try {
    $objectives = Invoke-RestMethod -Uri "$baseUrl/api/objectives/agent" -Method Get -Headers $headers
    Write-Host "✅ Objectifs récupérés!" -ForegroundColor Green
    Write-Host ($objectives | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Erreur objectifs: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔍 Test des IDs par type..." -ForegroundColor Green
$types = @("tasks", "habits", "projects", "objectives", "processes")
foreach ($type in $types) {
    try {
        $typeIds = Invoke-RestMethod -Uri "$baseUrl/api/debug/ids/$type" -Method Get -Headers $headers
        Write-Host "✅ IDs $type récupérés!" -ForegroundColor Green
        Write-Host ($typeIds | ConvertTo-Json -Depth 2)
    } catch {
        Write-Host "❌ Erreur IDs $type : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Tests terminés!" -ForegroundColor Green 