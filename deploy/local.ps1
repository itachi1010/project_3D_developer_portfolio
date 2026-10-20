param([ValidateSet('Start','Stop','Status')][string]$Action = 'Start')
$ErrorActionPreference = 'Stop'
$portfolioRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$envFile = Join-Path $portfolioRoot '.env.production.local'
if (-not (Test-Path -LiteralPath $envFile)) {
    if ($Action -ne 'Start') { throw 'Run deploy/local.ps1 -Action Start first.' }
    function New-LocalSecret {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        return -join ($bytes | ForEach-Object { $_.ToString('x2') })
    }
    $content = "POSTGRES_PASSWORD=$(New-LocalSecret)`nADMIN_USERNAME=admin`nADMIN_PASSWORD=$(New-LocalSecret)`nPORTFOLIO_PORT=8098`n"
    [IO.File]::WriteAllText($envFile, $content, (New-Object Text.UTF8Encoding($false)))
    Write-Host 'Generated ignored .env.production.local. Read it locally for admin credentials; do not paste them into chat.'
}
$composeArgs = @('compose','--project-directory',$portfolioRoot,'--env-file',$envFile,'-f',(Join-Path $portfolioRoot 'compose.production.yaml'))
switch ($Action) {
    'Start' { & docker @composeArgs up -d --build --wait --wait-timeout 240 }
    'Stop' { & docker @composeArgs stop }
    'Status' { & docker @composeArgs ps }
}
if ($LASTEXITCODE -ne 0) { throw "Portfolio $Action failed." }
if ($Action -eq 'Start') { Write-Host 'Portfolio preview: http://localhost:8098 (default port; see .env.production.local).' }
