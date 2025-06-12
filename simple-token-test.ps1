$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl19.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"

$today = Get-Date -Format "yyyy-MM-dd"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Date: $today"
Write-Host "Testing productif.io API..."

# Test productif.io directement
$url = "https://productif.io/api/tasks/agent/date?date=$today"
Write-Host "URL: $url"

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
    Write-Host "SUCCESS!"
    Write-Host "Tasks found: $($response.Count)"
    
    if ($response.Count -gt 0) {
        Write-Host "--- Tasks for today ---"
        foreach ($task in $response) {
            $status = if ($task.completed) { "DONE" } else { "TODO" }
            Write-Host "[$status] $($task.title) (ID: $($task.id))"
        }
    }
    
    # Output raw JSON for debugging
    Write-Host "--- Raw JSON Response ---"
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    
    # Try the Vercel URL
    Write-Host "Trying Vercel URL..."
    $vercelUrl = "https://productif-io-1-8zwo0kpln-noahs-projects-6c1762cf.vercel.app/api/tasks/agent/date?date=$today"
    
    try {
        $response2 = Invoke-RestMethod -Uri $vercelUrl -Headers $headers -Method GET
        Write-Host "VERCEL SUCCESS!"
        Write-Host "Tasks found: $($response2.Count)"
        $response2 | ConvertTo-Json -Depth 3
    } catch {
        Write-Host "VERCEL ALSO FAILED: $($_.Exception.Message)"
    }
} 