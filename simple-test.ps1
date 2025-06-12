$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiYWFmNjc5ZWYzNWRlNzJiOTViN2QwMDdlZDVjYWE4MTciLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJ0YXNrczp3cml0ZSIsImhhYml0czp3cml0ZSIsInByb2plY3RzOndyaXRlIl19.JM0xZftVtVE1YxjytuqXGOzmdm2Ti39_MAQ07aBqGjI"
$today = Get-Date -Format "yyyy-MM-dd"
$url = "https://productif-io-1-8zwo0kpln-noahs-projects-6c1762cf.vercel.app/api/tasks/agent/date?date=$today"

Write-Host "Testing URL: $url"
Write-Host "Date: $today"

try {
    $response = Invoke-RestMethod -Uri $url -Headers @{"Authorization" = "Bearer $token"} -Method GET
    Write-Host "SUCCESS! Status Code: 200"
    Write-Host "Number of tasks found: $($response.Length)"
    
    if ($response.Length -gt 0) {
        Write-Host "First task details:"
        $response[0] | Format-List id, title, completed, priority, dueDate
    } else {
        Write-Host "No tasks found for today."
    }
    
    # Show all tasks
    Write-Host "All tasks for today:"
    $response | ForEach-Object { 
        Write-Host "- [$($_.id)] $($_.title) (completed: $($_.completed))"
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Full error: $_"
} 