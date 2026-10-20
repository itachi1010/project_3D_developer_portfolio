param([string]$ToolsDirectory = '', [switch]$SkipImageImport)
$ErrorActionPreference = 'Stop'
$portfolioRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localDir = Join-Path $portfolioRoot '.local-deploy'
New-Item -ItemType Directory -Force -Path $localDir | Out-Null
$k3d = if ($ToolsDirectory) { Join-Path $ToolsDirectory 'k3d.exe' } else { (Get-Command k3d -ErrorAction Stop).Source }
$kubectl = if ($ToolsDirectory) { Join-Path $ToolsDirectory 'kubectl.exe' } else { (Get-Command kubectl -ErrorAction Stop).Source }
$clusters = (& $k3d cluster list -o json | ConvertFrom-Json)
if ($LASTEXITCODE -ne 0) { throw 'Cannot list local clusters.' }
if (-not ($clusters | Where-Object { $_.name -eq 'portfolio-local' })) {
    & $k3d cluster create --config (Join-Path $PSScriptRoot 'kubernetes/local/k3d.yaml')
    if ($LASTEXITCODE -ne 0) { throw 'Portfolio cluster creation failed.' }
} else {
    & $k3d cluster start portfolio-local
    if ($LASTEXITCODE -ne 0) { throw 'Cannot start portfolio cluster.' }
}
$credentials = & $k3d kubeconfig get portfolio-local
if ($LASTEXITCODE -ne 0) { throw 'Cannot read local cluster credentials.' }
$kubeconfig = Join-Path $localDir 'kubeconfig.yaml'
[IO.File]::WriteAllLines($kubeconfig, $credentials, (New-Object Text.UTF8Encoding($false)))
$kubeArgs = @('--kubeconfig',$kubeconfig,'--context','k3d-portfolio-local')
$clusterReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        & $kubectl @kubeArgs --request-timeout=5s get --raw=/readyz 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $clusterReady = $true; break }
    } catch { }
    Start-Sleep -Seconds 3
}
if (-not $clusterReady) { throw 'Portfolio cluster API is not ready. Inspect only k3d-portfolio-local-server-0 logs.' }
& $kubectl @kubeArgs wait --for=condition=Ready nodes --all --timeout=180s
if ($LASTEXITCODE -ne 0) { throw 'Local portfolio node is not ready.' }
& $kubectl @kubeArgs apply -f (Join-Path $PSScriptRoot 'kubernetes/local/bootstrap.yaml')
if ($LASTEXITCODE -ne 0) { throw 'Local-only bootstrap failed.' }
# Build through deploy/local.ps1 first so build-time frontend configuration agrees.
if (-not $SkipImageImport) {
    & $k3d image import benny-portfolio-api:local benny-portfolio-web:local -c portfolio-local
    if ($LASTEXITCODE -ne 0) { throw 'Image import failed. Run deploy/local.ps1 first.' }
}
$existingSecret = & $kubectl @kubeArgs -n demos get secret portfolio-secrets --ignore-not-found -o name
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect the portfolio Secret.' }
if (-not $existingSecret) {
    & (Join-Path $PSScriptRoot 'kubernetes/create-secret.ps1') -Kubectl $kubectl -Kubeconfig $kubeconfig -Context k3d-portfolio-local
}
# Start storage first; on a cold cluster PostgreSQL image pulls can take minutes.
& $kubectl @kubeArgs -n demos apply -f (Join-Path $PSScriptRoot 'kubernetes/base/postgres.yaml')
if ($LASTEXITCODE -ne 0) { throw 'Portfolio database manifests failed.' }
& $kubectl @kubeArgs -n demos rollout status statefulset/portfolio-db --timeout=300s
if ($LASTEXITCODE -ne 0) { throw 'Portfolio database is not ready.' }
$existingDeployments = @(& $kubectl @kubeArgs -n demos get deployment portfolio-api portfolio-web --ignore-not-found -o name)
if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect existing portfolio deployments.' }
& $kubectl @kubeArgs apply -k (Join-Path $PSScriptRoot 'kubernetes/local')
if ($LASTEXITCODE -ne 0) { throw 'Portfolio manifests failed.' }
# Re-importing the same local tag needs an explicit restart to use the new image.
if ($existingDeployments.Count) {
    & $kubectl @kubeArgs -n demos rollout restart @existingDeployments
    if ($LASTEXITCODE -ne 0) { throw 'Local image refresh failed.' }
}
foreach ($workload in @('statefulset/portfolio-db','deployment/portfolio-api','deployment/portfolio-web')) {
    & $kubectl @kubeArgs -n demos rollout status $workload --timeout=300s
    if ($LASTEXITCODE -ne 0) { throw "Not ready: $workload" }
}
& $kubectl @kubeArgs -n demos get pods,pvc,resourcequota
Write-Host 'Kubernetes portfolio preview: http://localhost:8099'
Write-Host 'This cluster and its database are separate from the Compose preview and both Cresol clusters.'
