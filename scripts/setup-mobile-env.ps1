# Setup Self-Contained Portable Android/JDK Environment for Windows
# Uses a shared user-level cache ($HOME\.portable-android-env) and links it into the project's `.local-env/`
# so you only download JDK 21 and Android SDK once across all your games!

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Shared cache location (uses universal $HOME variable - zero personal info hardcoded)
$SharedEnvDir = Join-Path $HOME ".portable-android-env"
if (-not (Test-Path $SharedEnvDir)) {
    New-Item -ItemType Directory -Path $SharedEnvDir | Out-Null
}

$SharedJdkDir = Join-Path $SharedEnvDir "jdk"
$SharedSdkDir = Join-Path $SharedEnvDir "android-sdk"
$CmdLineToolsDir = Join-Path $SharedSdkDir "cmdline-tools"
$CmdLineLatestDir = Join-Path $CmdLineToolsDir "latest"

# Project-local .local-env directory
$LocalEnvDir = Join-Path $PSScriptRoot "..\.local-env"
if (-not (Test-Path $LocalEnvDir)) {
    New-Item -ItemType Directory -Path $LocalEnvDir | Out-Null
}
$LocalJdkDir = Join-Path $LocalEnvDir "jdk"
$LocalSdkDir = Join-Path $LocalEnvDir "android-sdk"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  PORTABLE ANDROID ENVIRONMENT SETUP           " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Shared toolkit cache: $SharedEnvDir" -ForegroundColor Gray
Write-Host "Project link target:  $LocalEnvDir" -ForegroundColor Gray

# -------------------------------------------------------------
# 1. Download & Extract Portable JDK 21 (if not in shared cache)
# -------------------------------------------------------------
if (-not (Test-Path $SharedJdkDir)) {
    $JdkZipUrl = "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_windows_hotspot_21.0.3_9.zip"
    $JdkZipFile = Join-Path $SharedEnvDir "jdk.zip"
    
    Write-Host "`n[1/4] Downloading JDK 21 (Adoptium) to shared cache..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $JdkZipUrl -OutFile $JdkZipFile -UserAgent "Mozilla/5.0"
    
    Write-Host "Extracting JDK..." -ForegroundColor Yellow
    $TempExtractDir = Join-Path $SharedEnvDir "jdk_temp"
    if (Test-Path $TempExtractDir) { Remove-Item -Recurse -Force $TempExtractDir }
    
    Expand-Archive -Path $JdkZipFile -DestinationPath $TempExtractDir -Force
    
    $RootFolder = Get-ChildItem -Path $TempExtractDir | Select-Object -First 1
    Move-Item -Path $RootFolder.FullName -Destination $SharedJdkDir
    
    Remove-Item -Force $JdkZipFile
    Remove-Item -Recurse -Force $TempExtractDir
    Write-Host "JDK 21 installed in shared cache!" -ForegroundColor Green
} else {
    Write-Host "`n[1/4] JDK 21 found in shared cache." -ForegroundColor Green
}

# -------------------------------------------------------------
# 2. Download & Extract Android CommandLineTools (if not in shared cache)
# -------------------------------------------------------------
if (-not (Test-Path $CmdLineLatestDir)) {
    $SdkUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $SdkZipFile = Join-Path $SharedEnvDir "sdk-tools.zip"
    
    Write-Host "`n[2/4] Downloading Android Command Line Tools to shared cache..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $SdkUrl -OutFile $SdkZipFile -UserAgent "Mozilla/5.0"
    
    Write-Host "Extracting Command Line Tools..." -ForegroundColor Yellow
    $TempExtractDir = Join-Path $SharedEnvDir "sdk_temp"
    if (Test-Path $TempExtractDir) { Remove-Item -Recurse -Force $TempExtractDir }
    
    Expand-Archive -Path $SdkZipFile -DestinationPath $TempExtractDir -Force
    
    if (-not (Test-Path $CmdLineToolsDir)) {
        New-Item -ItemType Directory -Path $CmdLineToolsDir | Out-Null
    }
    
    $UnpackedCmdlineTools = Join-Path $TempExtractDir "cmdline-tools"
    Move-Item -Path $UnpackedCmdlineTools -Destination $CmdLineLatestDir
    
    Remove-Item -Force $SdkZipFile
    Remove-Item -Recurse -Force $TempExtractDir
    Write-Host "Android Command Line Tools installed in shared cache!" -ForegroundColor Green
} else {
    Write-Host "`n[2/4] Android Command Line Tools found in shared cache." -ForegroundColor Green
}

# Set environment variables for SDK Manager
$env:JAVA_HOME = $SharedJdkDir
$env:ANDROID_HOME = $SharedSdkDir
$env:PATH = "$SharedJdkDir\bin;$CmdLineLatestDir\bin;" + $env:PATH

$SdkManager = Join-Path $CmdLineLatestDir "bin\sdkmanager.bat"

# -------------------------------------------------------------
# 3. Accept Android Licenses & Install SDK Platforms (34 & 36)
# -------------------------------------------------------------
$Platform36Dir = Join-Path $SharedSdkDir "platforms\android-36"
if (-not (Test-Path $Platform36Dir)) {
    Write-Host "`n[3/4] Accepting Android SDK Licenses..." -ForegroundColor Yellow
    $LicenseDir = Join-Path $SharedSdkDir "licenses"
    if (-not (Test-Path $LicenseDir)) {
        New-Item -ItemType Directory -Path $LicenseDir | Out-Null
    }

    $YesInput = @("y", "y", "y", "y", "y", "y", "y", "y", "y", "y")
    $YesInput | & $SdkManager --licenses --sdk_root=$SharedSdkDir | Out-Null
    Write-Host "Licenses accepted!" -ForegroundColor Green

    Write-Host "`n[4/4] Installing SDK Platforms (34 & 36) and Build Tools..." -ForegroundColor Yellow
    & $SdkManager "platforms;android-34" "platforms;android-36" "build-tools;34.0.0" "build-tools;35.0.0" "platform-tools" --sdk_root=$SharedSdkDir
} else {
    Write-Host "`n[3/4] Android SDK Licenses & Platforms (34 & 36) already installed in shared cache." -ForegroundColor Green
}

# -------------------------------------------------------------
# 4. Link Shared Cache into Project's .local-env/ via Junctions
# -------------------------------------------------------------
Write-Host "`nLinking shared toolkit into project .local-env/..." -ForegroundColor Yellow
if (-not (Test-Path $LocalJdkDir)) {
    New-Item -ItemType Junction -Path $LocalJdkDir -Target $SharedJdkDir | Out-Null
}
if (-not (Test-Path $LocalSdkDir)) {
    New-Item -ItemType Junction -Path $LocalSdkDir -Target $SharedSdkDir | Out-Null
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "  PORTABLE ANDROID ENVIRONMENT IS FULLY READY!  " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host "You can now run 'npm run build:apk' or 'scripts/build-apk.ps1' to compile the APK." -ForegroundColor Cyan
