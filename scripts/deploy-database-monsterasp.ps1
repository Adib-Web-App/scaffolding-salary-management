# DANGEROUS: Overwrites wwwroot/data/production.db on the server with your local file.
# Always backup the live database first (see PRODUCTION-DEPLOYMENT.md).
#
# Upload local SQLite database to MonsterASP.NET (one-time restore or after data loss).
# Requires: Web Deploy 3 (msdeploy.exe) — same as GitHub Actions deploy.
#
# Usage:
#   $env:MONSTERASP_SERVER_PASSWORD = 'your-webdeploy-password'
#   .\scripts\deploy-database-monsterasp.ps1
#
# Optional env vars:
#   MONSTERASP_WEBSITE_NAME       (default: site71031)
#   MONSTERASP_SERVER_USERNAME    (default: same as website name)
#   MONSTERASP_SERVER_COMPUTER_NAME (default: https://{site}.siteasp.net:8172)

param(
  [string]$DbPath = (Join-Path $PSScriptRoot "..\server\data\production.db"),
  [string]$SiteName = $env:MONSTERASP_WEBSITE_NAME,
  [string]$Username = $env:MONSTERASP_SERVER_USERNAME,
  [string]$Password = $env:MONSTERASP_SERVER_PASSWORD,
  [string]$ComputerName = $env:MONSTERASP_SERVER_COMPUTER_NAME
)

$ErrorActionPreference = "Stop"

if (-not $SiteName) { $SiteName = "site71031" }
if (-not $Username) { $Username = $SiteName }

$DbPath = (Resolve-Path $DbPath -ErrorAction Stop).Path
$dbSize = (Get-Item $DbPath).Length
Write-Host "Local database: $DbPath ($dbSize bytes)"

if (-not $Password) {
  $secure = Read-Host "WebDeploy password for $Username" -AsSecureString
  $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ($ComputerName) {
  $base = $ComputerName.Trim().TrimEnd("/")
} else {
  $base = "https://${SiteName}.siteasp.net:8172"
}
$destUrl = "${base}/msdeploy.axd?site=${SiteName}"

$msdeploy = @(
  "${env:ProgramFiles}\IIS\Microsoft Web Deploy V3\msdeploy.exe",
  "${env:ProgramFiles(x86)}\IIS\Microsoft Web Deploy V3\msdeploy.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $msdeploy) {
  throw @"
Web Deploy (msdeploy.exe) not found.
Install: https://www.iis.net/downloads/microsoft/web-deploy
Or upload manually via MonsterASP File Manager / FTP to: wwwroot/data/production.db
"@
}

Write-Host "WARNING: This will REPLACE the live production.db on the server." -ForegroundColor Yellow
$confirm = Read-Host "Type YES to continue"
if ($confirm -ne 'YES') { throw 'Upload cancelled.' }

Write-Host "Uploading to site: $SiteName -> data/production.db"
Write-Host "MSDeploy URL: $destUrl"

& $msdeploy `
  -verb:sync `
  -source:filePath="$DbPath" `
  -dest:filePath="data/production.db",contentPath="$SiteName",computerName="$destUrl",userName="$Username",password="$Password",authtype="Basic" `
  -allowUntrusted `
  -verbose

if ($LASTEXITCODE -ne 0) {
  throw "MSDeploy failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Done. Restart the site in MonsterASP panel if data does not appear immediately."
Write-Host "Verify: http://scaffolding-salary-management.runasp.net/api/health"
