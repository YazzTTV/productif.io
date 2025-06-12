# Test complet de tous les endpoints API Agent - productif.io
# Version corrigée avec les vraies URLs

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl0.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"

$baseUrl = "https://productif.io"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = $headers,
        [string]$Body = $null
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  $Method $Url" -ForegroundColor Gray
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        
        Write-Host "  ✅ SUCCESS" -ForegroundColor Green
        if ($response -is [array]) {
            Write-Host "  📊 Returned: $($response.Count) items" -ForegroundColor Cyan
        } elseif ($response.PSObject.Properties.Count) {
            Write-Host "  📊 Properties: $($response.PSObject.Properties.Count)" -ForegroundColor Cyan
        }
        
        $script:testResults += [PSCustomObject]@{
            Name = $Name
            Url = $Url
            Method = $Method
            Status = "SUCCESS"
            Error = $null
        }
        
        return $response
    }
    catch {
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
        
        $script:testResults += [PSCustomObject]@{
            Name = $Name
            Url = $Url
            Method = $Method
            Status = "ERROR"
            Error = $_.Exception.Message
        }
        
        return $null
    }
}

Write-Host "=== TEST COMPLET DES API AGENT ===" -ForegroundColor Green
Write-Host "Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host ""

# ===== SECTION 1: ENDPOINTS DE DEBUG =====
Write-Host "=== 1. ENDPOINTS DE DEBUG ===" -ForegroundColor Magenta

Test-Endpoint "Token validation" "$baseUrl/api/test-token"
Test-Endpoint "Quick IDs" "$baseUrl/api/debug/quick-ids"

Write-Host ""

# ===== SECTION 2: TASKS (TACHES) =====
Write-Host "=== 2. TASKS (TACHES) ===" -ForegroundColor Magenta

Test-Endpoint "Liste toutes les taches" "$baseUrl/api/tasks/agent"
Test-Endpoint "Taches d'aujourd'hui" "$baseUrl/api/tasks/agent/date?date=2025-01-15"
Test-Endpoint "Taches non completees" "$baseUrl/api/tasks/agent?completed=false"
Test-Endpoint "Taches planifiees" "$baseUrl/api/tasks/agent?scheduled=true"

Write-Host ""

# ===== SECTION 3: HABITS (HABITUDES) =====
Write-Host "=== 3. HABITS (HABITUDES) ===" -ForegroundColor Magenta

Test-Endpoint "Liste toutes les habitudes" "$baseUrl/api/habits/agent"

Write-Host ""

# ===== SECTION 4: OBJECTIVES (OBJECTIFS) =====
Write-Host "=== 4. OBJECTIVES (OBJECTIFS) ===" -ForegroundColor Magenta

Test-Endpoint "Liste missions et objectifs" "$baseUrl/api/objectives/agent"
Test-Endpoint "Missions du trimestre actuel" "$baseUrl/api/objectives/agent?current=true"

Write-Host ""

# ===== SECTION 5: PROCESSES (PROCESSUS) =====
Write-Host "=== 5. PROCESSES (PROCESSUS) ===" -ForegroundColor Magenta

Test-Endpoint "Liste tous les processus" "$baseUrl/api/processes/agent"
Test-Endpoint "Processus avec stats" "$baseUrl/api/processes/agent?includeStats=true"
Test-Endpoint "Processus avec taches" "$baseUrl/api/processes/agent?includeTasks=true"

Write-Host ""

# ===== SECTION 6: TESTS DE SECURITE =====
Write-Host "=== 6. TESTS DE SECURITE ===" -ForegroundColor Magenta

Write-Host "Testing: Endpoint SANS token (doit echouer)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/tasks/agent" -Method GET -Headers @{"Content-Type" = "application/json"}
    Write-Host "  ❌ PROBLEME DE SECURITE: Endpoint accessible sans token!" -ForegroundColor Red
} catch {
    Write-Host "  ✅ SECURITE OK: Acces refuse sans token" -ForegroundColor Green
    Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Cyan
}

Write-Host "Testing: Endpoint avec token INVALIDE (doit echouer)" -ForegroundColor Yellow
try {
    $invalidHeaders = @{
        "Authorization" = "Bearer invalid.token.here"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/tasks/agent" -Method GET -Headers $invalidHeaders
    Write-Host "  ❌ PROBLEME DE SECURITE: Token invalide accepte!" -ForegroundColor Red
} catch {
    Write-Host "  ✅ SECURITE OK: Token invalide refuse" -ForegroundColor Green
    Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Cyan
}

Write-Host ""

# ===== SECTION 7: TEST DES ENDPOINTS FANTOMES (DOIVENT ECHOUER) =====
Write-Host "=== 7. VERIFICATION ENDPOINTS FANTOMES (doivent echouer) ===" -ForegroundColor Magenta

Test-Endpoint "Endpoint fantome: agent/tasks/today" "$baseUrl/api/agent/tasks/today"
Test-Endpoint "Endpoint fantome: agent/dashboard/metrics" "$baseUrl/api/agent/dashboard/metrics"
Test-Endpoint "Endpoint fantome: agent/achievements" "$baseUrl/api/agent/achievements"

Write-Host ""

# ===== SECTION 8: RESUME DES RESULTATS =====
Write-Host "=== 8. RESUME DES RESULTATS ===" -ForegroundColor Green

$successCount = ($testResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
$errorCount = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$totalCount = $testResults.Count

Write-Host "Total des tests: $totalCount" -ForegroundColor Cyan
Write-Host "Succes: $successCount" -ForegroundColor Green
Write-Host "Erreurs: $errorCount" -ForegroundColor Red

Write-Host ""
Write-Host "=== DETAILS DES ERREURS ===" -ForegroundColor Yellow
$testResults | Where-Object { $_.Status -eq "ERROR" } | ForEach-Object {
    Write-Host "❌ $($_.Name)" -ForegroundColor Red
    Write-Host "   $($_.Method) $($_.Url)" -ForegroundColor Gray
    Write-Host "   Error: $($_.Error)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=== ENDPOINTS QUI FONCTIONNENT ===" -ForegroundColor Green
$testResults | Where-Object { $_.Status -eq "SUCCESS" } | ForEach-Object {
    Write-Host "✅ $($_.Name)" -ForegroundColor Green
    Write-Host "   $($_.Method) $($_.Url)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== TESTS TERMINES ===" -ForegroundColor Green
Write-Host "Documentation mise a jour avec les vraies URLs!" -ForegroundColor Cyan 