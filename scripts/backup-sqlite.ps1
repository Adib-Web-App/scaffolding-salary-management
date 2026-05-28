# Backup local or server SQLite database before deploy/migration.
#
# Usage (local):
#   .\scripts\backup-sqlite.ps1
#   .\scripts\backup-sqlite.ps1 -DbPath "C:\path\to\production.db"
#
# Output: same folder as DB, file named production.db.backup-YYYYMMDD-HHMMSS

param(
  [string]$DbPath = (Join-Path $PSScriptRoot "..\server\data\production.db")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $DbPath)) {
  throw "Database not found: $DbPath"
}

$resolved = (Resolve-Path $DbPath).Path
$dir = Split-Path $resolved -Parent
$base = [System.IO.Path]::GetFileNameWithoutExtension($resolved)
$ext = [System.IO.Path]::GetExtension($resolved)
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $dir "$base$ext.backup-$stamp"

Copy-Item -Path $resolved -Destination $backup -Force
$size = (Get-Item $backup).Length

Write-Host "Backup created:"
Write-Host "  $backup"
Write-Host "  ($size bytes)"
Write-Host ""
Write-Host "MonsterASP: download wwwroot/data/production.db via FTP/File Manager, then run this script locally on the copy, or copy on-server before updates."
