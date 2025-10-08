$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMTBkZDQwMTYyZDM4YzU1YjhmNmQwOTI1MjVjZjRiOTAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.X1CQMOsCBvk9DxUzUogguU9ruFKN0aaHUa44R6dpmM0"

$headers = @{
    "Authorization" = "Bearer $token"
}
 
$response = Invoke-RestMethod -Uri "https://productif-io-1-m2edizrwt-noahs-projects-6c1762cf.vercel.app/api/debug/ids/user-team" -Headers $headers -Method Get
$response | ConvertTo-Json -Depth 10 