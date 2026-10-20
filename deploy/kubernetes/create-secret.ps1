# Sends credentials through stdin, never through CLI arguments or command output.
param(
    [Parameter(Mandatory=$true)][string]$Kubectl,
    [Parameter(Mandatory=$true)][string]$Kubeconfig,
    [Parameter(Mandatory=$true)][ValidateSet('k3d-portfolio-local')][string]$Context
)
$ErrorActionPreference = 'Stop'
$portfolioRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$envFile = Join-Path $portfolioRoot '.env.production.local'
if (-not (Test-Path -LiteralPath $envFile)) { throw 'Run deploy/local.ps1 first to generate local-only credentials.' }
$values = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') { $values[$matches[1]] = $matches[2] }
}
if ($values['ADMIN_PASSWORD'].Length -lt 20 -or -not $values['POSTGRES_PASSWORD']) { throw 'Missing or invalid local credentials.' }
$encodedPassword = [Uri]::EscapeDataString($values['POSTGRES_PASSWORD'])
$secret = @{
    apiVersion = 'v1'; kind = 'Secret'
    metadata = @{ name = 'portfolio-secrets'; namespace = 'demos' }
    type = 'Opaque'
    stringData = @{
        POSTGRES_PASSWORD = $values['POSTGRES_PASSWORD']
        DATABASE_URL = "postgresql://portfolio:${encodedPassword}@portfolio-db:5432/portfolio"
        ADMIN_USERNAME = $values['ADMIN_USERNAME']
        ADMIN_PASSWORD = $values['ADMIN_PASSWORD']
    }
}
$secret | ConvertTo-Json -Depth 8 -Compress | & $Kubectl --kubeconfig $Kubeconfig --context $Context create -f -
if ($LASTEXITCODE -ne 0) { throw 'Secret creation failed. Existing secrets are deliberately not overwritten.' }
