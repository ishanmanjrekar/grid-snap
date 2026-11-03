# Build Android APK using local portable environment
# Automatically bootstraps '.local-env' via 'scripts/setup-mobile-env.ps1' if missing.

$ErrorActionPreference = "Stop"

$ProjectRootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$LocalEnvDir = Join-Path $ProjectRootDir ".local-env"
$JdkDir = Join-Path $LocalEnvDir "jdk"
$SdkDir = Join-Path $LocalEnvDir "android-sdk"
$DumpDir = Join-Path $ProjectRootDir "dump"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "         COMPILING NATIVE DEBUG APK           " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# -------------------------------------------------------------
# 1. Verify (or Bootstrap) Portable Environment
# -------------------------------------------------------------
if (-not (Test-Path $JdkDir) -or -not (Test-Path $SdkDir)) {
    Write-Host "Local portable environment not linked yet. Running setup-mobile-env.ps1..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "setup-mobile-env.ps1")
}

# Setup env variables for compilation
$env:JAVA_HOME = $JdkDir
$env:ANDROID_HOME = $SdkDir
$env:PATH = "$JdkDir\bin;" + $env:PATH

# -------------------------------------------------------------
# 2. Run Pre-Build Harness Verification & Asset/Icon Sync
# -------------------------------------------------------------
$VerifyScript = Join-Path $PSScriptRoot "verify-build.js"
if (Test-Path $VerifyScript) {
    node $VerifyScript
}

$UpdateAssetsScript = Join-Path $PSScriptRoot "update-assets.js"
if (Test-Path $UpdateAssetsScript) {
    node $UpdateAssetsScript
}

$GenerateIconsScript = Join-Path $PSScriptRoot "generate-icons.py"
$IconSource = Join-Path $ProjectRootDir "android-assets\icon.png"
if ((Test-Path $GenerateIconsScript) -and (Test-Path $IconSource)) {
    python $GenerateIconsScript
}

# -------------------------------------------------------------
# 3. Configure local.properties & Purge Stale Caches
# -------------------------------------------------------------
$AndroidDir = Join-Path $ProjectRootDir "android"
if (-not (Test-Path $AndroidDir)) {
    Write-Host "Error: The native 'android' directory does not exist!" -ForegroundColor Red
    Write-Host "Please ensure you have initialized the Capacitor Android project by running 'npx cap add android'." -ForegroundColor Yellow
    Exit 1
}

$LocalPropertiesFile = Join-Path $AndroidDir "local.properties"
Write-Host "`n[1/5] Configuring Gradle SDK locations..." -ForegroundColor Yellow
$EscapedSdkPath = $SdkDir.Replace("\", "\\")
"sdk.dir=$EscapedSdkPath" | Out-File -FilePath $LocalPropertiesFile -Encoding ascii

Write-Host "`n[2/5] Purging stale web and native build caches..." -ForegroundColor Yellow
$DistDir = Join-Path $ProjectRootDir "dist"
$CapacitorAssetsDir = Join-Path $ProjectRootDir "android\app\src\main\assets\public"
$GradleCacheDir = Join-Path $ProjectRootDir "android\.gradle"
$ViteCacheDir = Join-Path $ProjectRootDir "node_modules\.vite"

if (Test-Path $DistDir) { Remove-Item -Path $DistDir -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $CapacitorAssetsDir) { Remove-Item -Path $CapacitorAssetsDir -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $GradleCacheDir) { Remove-Item -Path $GradleCacheDir -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $ViteCacheDir) { Remove-Item -Path $ViteCacheDir -Recurse -Force -ErrorAction SilentlyContinue }

# -------------------------------------------------------------
# 4. Build Web Bundle & Sync to Capacitor Android
# -------------------------------------------------------------
Write-Host "`n[3/5] Compiling production web bundle..." -ForegroundColor Yellow
Push-Location $ProjectRootDir
try {
    npm run build
    Write-Host "`n[4/5] Syncing web bundle to Android native platform..." -ForegroundColor Yellow
    npx cap sync android
} finally {
    Pop-Location
}

# -------------------------------------------------------------
# 5. Compile the Android APK via Gradle
# -------------------------------------------------------------
Write-Host "`n[5/5] Compiling Android APK with Gradle..." -ForegroundColor Yellow

Push-Location $AndroidDir
try {
    & .\gradlew.bat clean assembleDebug
} finally {
    Pop-Location
}

# -------------------------------------------------------------
# 6. Copy Finished APK to Dump Directory with Timestamp
# -------------------------------------------------------------
$BuiltApkPath = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
$Timestamp = Get-Date -Format "ddMMyy-HHmm"
$PackageJson = Get-Content -Raw -Path (Join-Path $ProjectRootDir "package.json") | ConvertFrom-Json
$AppName = $PackageJson.name
$TargetApkName = "${AppName}-${Timestamp}-android.apk"
$TargetApkPath = Join-Path $DumpDir $TargetApkName

if (Test-Path $BuiltApkPath) {
    if (-not (Test-Path $DumpDir)) {
        New-Item -ItemType Directory -Path $DumpDir | Out-Null
    }
    
    Copy-Item -Path $BuiltApkPath -Destination $TargetApkPath -Force
    
    Write-Host "`n==============================================" -ForegroundColor Green
    Write-Host "  APK COMPILED AND SAVED SUCCESSFULLY!        " -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "Saved Location: $TargetApkPath" -ForegroundColor Cyan
    Write-Host "Size: $((Get-Item $TargetApkPath).Length / 1MB | ForEach-Object { '{0:N2}' -f $_ }) MB" -ForegroundColor Gray
} else {
    Write-Host "Error: The build finished but the output APK could not be found at: $BuiltApkPath" -ForegroundColor Red
    Exit 1
}
