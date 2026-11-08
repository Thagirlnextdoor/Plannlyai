# Builds the signed Android APK (TWA wrapper) for Plannlyai.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-apk.ps1
#
# Prerequisites (already installed on this machine):
#   - JDK 17            : C:\Users\USER\jdk17  (a space-free junction to
#                          "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot";
#                          Bubblewrap invokes java.exe without quoting, so a path
#                          containing spaces breaks the signing step).
#   - Android SDK       : %LOCALAPPDATA%\Android\Sdk (platform-tools, platform-34,
#                          build-tools 36.1.0) plus a bin\shim so Bubblewrap's
#                          SDK-root validation passes.
#   - @bubblewrap/cli   : npm i -g @bubblewrap/cli
#
# Gotchas this script encodes:
#   - twa-manifest.json must be regenerated whenever it changes
#     (node scripts/gen-twa.js) or `bubblewrap build` prompts and dies without a TTY.
#   - build must run with cwd = android\twa (gradlew lives there) and pass the
#     manifest by absolute path.
#   - the keystore is PKCS12: store password and key password MUST be the same
#     value (android\storepass.txt). keypass.txt is ignored by PKCS12.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$keystoreDir = Join-Path $root "android"

$env:JAVA_HOME = "C:\Users\USER\jdk17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = "$env:LOCALAPPDATA\Android\Sdk"

# PKCS12 supports a single password, so both env vars take the store password.
$storePass = (Get-Content (Join-Path $keystoreDir "storepass.txt") -Raw).Trim()
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $storePass
$env:BUBBLEWRAP_KEY_PASSWORD = $storePass

Push-Location $root
try {
  # 1. Regenerate the Android project + manifest checksum (no prompts possible).
  node (Join-Path $root "scripts\gen-twa.js")
  if ($LASTEXITCODE -ne 0) { throw "TWA project generation failed" }

  # 2. Compile, zipalign and sign.
  Push-Location (Join-Path $root "android\twa")
  try {
    cmd /c "bubblewrap build --manifest `"$root\twa-manifest.json`" 2>&1" |
      Tee-Object -Variable log
    if ($LASTEXITCODE -ne 0) { throw "bubblewrap build failed (exit $LASTEXITCODE)" }
  }
  finally { Pop-Location }

  $apk = Join-Path $root "android\twa\app-release-signed.apk"
  if (-not (Test-Path $apk)) { throw "APK not produced at $apk" }
  Get-Item $apk | Select-Object FullName, Length, LastWriteTime
}
finally { Pop-Location }
