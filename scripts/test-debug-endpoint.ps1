# Définir le token
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMTBkZDQwMTYyZDM4YzU1YjhmNmQwOTI1MjVjZjRiOTAiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbInRhc2tzOnJlYWQiLCJoYWJpdHM6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInByb2Nlc3Nlczp3cml0ZSIsIm9iamVjdGl2ZXM6d3JpdGUiLCJwcm9qZWN0czp3cml0ZSIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIl19.VwPXd4VoixG6XWBJbEdzZD0kkwP3nTXRVsWPaBhuX4U"

# Définir les headers
$headers = @{
    "Authorization" = "Bearer $token"
}

# Faire la requête
Write-Host "Test de l'endpoint debug/ids/user-team..."
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/debug/ids/user-team" -Headers $headers -Method Get

# Afficher la réponse
Write-Host "Réponse :"
$response | ConvertTo-Json -Depth 10 