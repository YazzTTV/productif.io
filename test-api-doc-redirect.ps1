# Test des API avec gestion des redirections
# Script basé sur la documentation officielle docs/api-tokens.md

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl0.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"

# URLs à tester
$baseUrls = @(
    "https://productif.io",
    "https://www.productif.io",
    "http://productif.io"
)

Write-Host "=== Tests API avec gestion des redirections ===" -ForegroundColor Green
Write-Host ""

function Test-Endpoint {
    param(
        [string]$BaseUrl,
        [string]$Endpoint,
        [string]$Description
    )
    
    Write-Host "Testing: $BaseUrl$Endpoint" -ForegroundColor Cyan
    try {
        # Configuration pour gérer les redirections et HTTPS
        $response = Invoke-RestMethod -Uri "$BaseUrl$Endpoint" -Method GET -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } -MaximumRedirection 5 -SkipCertificateCheck -ErrorAction Stop
        
        Write-Host "✅ $Description - Succès !" -ForegroundColor Green
        Write-Host "Réponse:" -ForegroundColor Yellow
        $response | ConvertTo-Json -Depth 3 | Write-Host
        return $true
    } catch {
        Write-Host "❌ $Description - Erreur: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Code: $($_.Exception.Response.StatusCode) - $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
        }
        return $false
    }
}

# Test avec chaque URL de base
foreach ($baseUrl in $baseUrls) {
    Write-Host "`n" + "="*60 + "`n"
    Write-Host "Testing base URL: $baseUrl" -ForegroundColor Magenta
    Write-Host "="*60

    # Test 1: Token
    $success1 = Test-Endpoint -BaseUrl $baseUrl -Endpoint "/api/test-token" -Description "Test token"
    
    if ($success1) {
        Write-Host "`n--- Cette URL fonctionne ! Continuons les tests ---`n" -ForegroundColor Green
        
        # Test 2: IDs rapides
        Test-Endpoint -BaseUrl $baseUrl -Endpoint "/api/debug/quick-ids" -Description "IDs rapides"
        
        # Test 3: Tâches du jour
        Test-Endpoint -BaseUrl $baseUrl -Endpoint "/api/agent/tasks/today" -Description "Tâches du jour"
        
        # Test 4: Habitudes
        Test-Endpoint -BaseUrl $baseUrl -Endpoint "/api/habits/agent" -Description "Habitudes"
        
        Write-Host "`n✅ Tests réussis avec $baseUrl" -ForegroundColor Green
        break
    } else {
        Write-Host "`n❌ $baseUrl ne fonctionne pas, test suivant...`n" -ForegroundColor Red
    }
}

Write-Host "`n" + "="*60 + "`n"
Write-Host "=== Tests terminés ===" -ForegroundColor Green 