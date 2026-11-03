# Build Itch.io ZIP Package using local environment
$ErrorActionPreference = "Stop"

$ProjectRootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$DumpDir = Join-Path $ProjectRootDir "dump"
$DistDir = Join-Path $ProjectRootDir "dist"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "         COMPILING ITCH.IO ZIP PACKAGE        " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# -------------------------------------------------------------
# 1. Run Pre-Build Harness Verification & Purge Web Caches
# -------------------------------------------------------------
$VerifyScript = Join-Path $PSScriptRoot "verify-build.js"
if (Test-Path $VerifyScript) {
    node $VerifyScript
}

Write-Host "`n[1/4] Purging web build caches..." -ForegroundColor Yellow
if (Test-Path $DistDir) { 
    Remove-Item -Path $DistDir -Recurse -Force -ErrorAction SilentlyContinue 
}

# -------------------------------------------------------------
# 2. Build Web Bundle in Itch Mode (Loads .env.itch)
# -------------------------------------------------------------
Write-Host "`n[2/4] Compiling web bundle in Itch mode..." -ForegroundColor Yellow

$UpdateAssetsScript = Join-Path $PSScriptRoot "update-assets.js"
if (Test-Path $UpdateAssetsScript) {
    node $UpdateAssetsScript
}

Push-Location $ProjectRootDir
try {
    npx vite build --mode itch
} finally {
    Pop-Location
}

# -------------------------------------------------------------
# 3. Zip Finished dist Folder to Dump Directory
# -------------------------------------------------------------
$Timestamp = Get-Date -Format "ddMMyy-HHmm"
$PackageJson = Get-Content -Raw -Path (Join-Path $ProjectRootDir "package.json") | ConvertFrom-Json
$AppName = $PackageJson.name
$TargetZipName = "${AppName}-${Timestamp}-itch.zip"
$TargetZipPath = Join-Path $DumpDir $TargetZipName

Write-Host "`n[3/4] Creating zip archive..." -ForegroundColor Yellow

if (-not (Test-Path $DumpDir)) {
    New-Item -ItemType Directory -Path $DumpDir | Out-Null
}

# Change directory to dist so index.html is at the root of the ZIP archive
Push-Location $DistDir
try {
    npx bestzip $TargetZipPath *
} finally {
    Pop-Location
}

# -------------------------------------------------------------
# 4. Verification
# -------------------------------------------------------------
if (Test-Path $TargetZipPath) {
    Write-Host "`n==============================================" -ForegroundColor Green
    Write-Host "  ITCH ZIP COMPILED AND SAVED SUCCESSFULLY!   " -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "Saved Location: $TargetZipPath" -ForegroundColor Cyan
    Write-Host "Size: $((Get-Item $TargetZipPath).Length / 1MB | ForEach-Object { '{0:N2}' -f $_ }) MB" -ForegroundColor Gray
} else {
    Write-Host "Error: The build finished but the output ZIP could not be found at: $TargetZipPath" -ForegroundColor Red
    Exit 1
}
