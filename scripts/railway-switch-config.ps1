param(
  [ValidateSet('ai','scheduler')]
  [string]$target
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $root '..')
Set-Location $repoRoot

function Copy-Config($src) {
  if (-not (Test-Path $src)) { throw "Config file not found: $src" }
  Copy-Item -Force $src 'railway.toml'
}

switch ($target) {
  'ai'        { Copy-Config 'railway.ai.toml'; Write-Host '✅ railway.toml set to AI config' }
  'scheduler' { Copy-Config 'railway.scheduler.toml'; Write-Host '✅ railway.toml set to Scheduler config' }
  default     { throw 'Usage: .\\scripts\\railway-switch-config.ps1 -target ai|scheduler' }
}

