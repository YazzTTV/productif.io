$ErrorActionPreference = 'Stop'

$url = 'https://agent-ia-production.up.railway.app/webhook'

$payload = @{
  object = 'whatsapp_business_account'
  entry  = @(
    @{
      id = 'test'
      changes = @(
        @{
          field = 'messages'
          value = @{
            messaging_product = 'whatsapp'
            metadata = @{ display_phone_number = '33783242840'; phone_number_id = '589370880934492' }
            messages = @(
              @{
                from = '33783642205'
                id   = 'wamid.test.manual'
                type = 'text'
                text = @{ body = 'Conseils du jour' }
              }
            )
          }
        }
      )
    }
  )
}

$body = $payload | ConvertTo-Json -Depth 10

Write-Host "POST $url" -ForegroundColor Cyan
Write-Host $body

$resp = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $body
Write-Host "Status: OK" -ForegroundColor Green
Write-Host ($resp | ConvertTo-Json -Depth 5)


