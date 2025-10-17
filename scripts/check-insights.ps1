param(
  [string]$Phone = '',
  [string]$Email = '',
  [string]$BaseUrl = 'https://www.productif.io',
  [string]$Token = ''
)

$ErrorActionPreference = 'Stop'

if (-not $Phone -and -not $Email) {
  Write-Host "Usage: .\\scripts\\check-insights.ps1 -Phone 3378... [-BaseUrl https://www.productif.io]" -ForegroundColor Yellow
  Write-Host "   or: .\\scripts\\check-insights.ps1 -Email user@example.com" -ForegroundColor Yellow
  exit 1
}

if ($Phone) { $Env:WHATSAPP_PHONE = ($Phone -replace "\D", "") }
if ($Email) { $Env:USER_EMAIL = $Email }
$Env:NEXT_PUBLIC_APP_URL = $BaseUrl
if ($Token) { $Env:JOURNAL_TOKEN = $Token }

Write-Host "BaseUrl: $BaseUrl" -ForegroundColor Cyan
if ($Env:WHATSAPP_PHONE) { Write-Host "Phone: $Env:WHATSAPP_PHONE" -ForegroundColor Cyan }
if ($Env:USER_EMAIL) { Write-Host "Email: $Env:USER_EMAIL" -ForegroundColor Cyan }

npx tsx scripts/check-insights.ts


