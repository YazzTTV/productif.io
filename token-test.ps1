$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl19.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"

# Décoder le JWT pour vérifier son contenu
Write-Host "=== ANALYSE DU TOKEN JWT ===" -ForegroundColor Cyan
$parts = $token.Split('.')
if ($parts.Length -eq 3) {
    # Décoder le header
    $header = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($parts[0] + "=="))
    Write-Host "Header: $header" -ForegroundColor Yellow
    
    # Décoder le payload
    $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($parts[1] + "=="))
    Write-Host "Payload: $payload" -ForegroundColor Yellow
} else {
    Write-Host "Token malformé!" -ForegroundColor Red
}

Write-Host "`n=== TEST ENDPOINTS ===" -ForegroundColor Cyan

# Test avec différentes URLs
$urls = @(
    "https://productif.io",
    "https://www.productif.io",
    "https://productif-io-1-8zwo0kpln-noahs-projects-6c1762cf.vercel.app"
)

$today = Get-Date -Format "yyyy-MM-dd"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

foreach ($baseUrl in $urls) {
    Write-Host "`nTesting: $baseUrl" -ForegroundColor Green
    
    # Test 1: Endpoint de test simple
    try {
        $testUrl = "$baseUrl/api/test-token"
        Write-Host "Testing token validity: $testUrl"
        $response = Invoke-RestMethod -Uri $testUrl -Headers $headers -Method GET -ErrorAction Stop
        Write-Host "✅ Token is valid!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
    } catch {
        Write-Host "❌ Token test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 2: Tasks agent basic
    try {
        $tasksUrl = "$baseUrl/api/tasks/agent"
        Write-Host "Testing tasks agent: $tasksUrl"
        $tasks = Invoke-RestMethod -Uri $tasksUrl -Headers $headers -Method GET -ErrorAction Stop
        Write-Host "✅ Tasks endpoint works! Found $($tasks.Count) tasks" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tasks agent failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 3: Tasks agent for today
    try {
        $todayUrl = "$baseUrl/api/tasks/agent/date?date=$today"
        Write-Host "Testing tasks for today: $todayUrl"
        $todayTasks = Invoke-RestMethod -Uri $todayUrl -Headers $headers -Method GET -ErrorAction Stop
        Write-Host "✅ TODAY'S TASKS FOUND! Count: $($todayTasks.Count)" -ForegroundColor Green
        
        if ($todayTasks.Count -gt 0) {
            Write-Host "=== TASKS FOR TODAY ($today) ===" -ForegroundColor Magenta
            foreach ($task in $todayTasks) {
                $status = if ($task.completed) { "✅" } else { "❌" }
                $priority = switch ($task.priority) {
                    0 { "🟢 Quick Win" }
                    1 { "🔴 Urgent" }
                    2 { "🟡 Important" }
                    3 { "🔵 A faire" }
                    4 { "⚪ Optionnel" }
                    default { "❓ Unknown" }
                }
                Write-Host "$status [$($task.id)] $($task.title)" -ForegroundColor White
                Write-Host "   Priority: $priority | Due: $($task.dueDate)" -ForegroundColor Gray
            }
        } else {
            Write-Host "No tasks found for today ($today)" -ForegroundColor Yellow
        }
        
        # Si on arrive ici avec succès, on a trouvé la bonne URL
        Write-Host "`n🎉 ENDPOINT WORKING: $todayUrl" -ForegroundColor Green
        return
        
    } catch {
        Write-Host "❌ Today's tasks failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n❌ All endpoints failed" -ForegroundColor Red 