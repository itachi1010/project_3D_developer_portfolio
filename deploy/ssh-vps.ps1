param(
    [Parameter(Mandatory = $true)][string]$Command,
    [string]$KnownHosts,
    [string]$IdentityFile = (Join-Path $env:USERPROFILE '.ssh/cresol_vps')
)
$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not $KnownHosts) {
    $KnownHosts = Join-Path $repoRoot '.local-deploy/vps-private/known-hosts'
}
if (-not (Test-Path -LiteralPath $KnownHosts)) {
    throw 'Verified known-host record missing. Read docs/PORTFOLIO_HANDOFF.md; do not bypass host verification.'
}
$fingerprint = & ssh-keygen -lf $KnownHosts
if ($LASTEXITCODE -ne 0 -or @($fingerprint).Count -ne 1 -or
    $fingerprint -notmatch 'SHA256:ux7GbId7YEjk/WkvlX59qmX/6y08\+xwgFSvYb/GgLLI(?:\s|$)') {
    throw 'VPS host identity does not match the independently verified fingerprint.'
}
if (-not (Test-Path -LiteralPath $IdentityFile)) { throw 'Local SSH identity file is missing.' }
# Base64 preserves Windows/Linux quoting. It is not encryption or secret transport.
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("set -euo pipefail`n" + $Command))
& ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$KnownHosts" `
    -o ConnectTimeout=10 -o ConnectionAttempts=1 -o KexAlgorithms=curve25519-sha256 `
    -o HostKeyAlgorithms=ssh-ed25519 -o IdentitiesOnly=yes -i $IdentityFile `
    root@45.9.191.177 "printf %s $encoded | base64 -d | bash"
if ($LASTEXITCODE -ne 0) { throw "VPS command failed (exit $LASTEXITCODE)." }
