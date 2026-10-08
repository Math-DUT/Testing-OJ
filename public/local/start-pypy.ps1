$ErrorActionPreference = 'Stop'
$runnerRoot = Join-Path $env:LOCALAPPDATA 'TestingOJ'
$runtimeRoot = Join-Path $runnerRoot 'pypy3.11-v8.0.0-win64'
$pypyExe = Join-Path $runtimeRoot 'pypy3.exe'
if (-not (Test-Path -LiteralPath $pypyExe)) {
    New-Item -ItemType Directory -Path $runnerRoot -Force | Out-Null
    $archivePath = Join-Path $runnerRoot 'pypy3.11-v8.0.0-win64.zip'
    Write-Host 'Downloading PyPy3 (31 MB), only needed on first launch...'
    Invoke-WebRequest -UseBasicParsing -Uri 'https://downloads.python.org/pypy/pypy3.11-v8.0.0-win64.zip' -OutFile $archivePath
    $digest = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
    if ($digest -ne 'AF7383C6C4FBCCEC8B904FC8F59678764253A0E9D5AD89C1F34B7D7E68AFE715') {
        throw 'PyPy download checksum mismatch. Please download the helper again.'
    }
    Expand-Archive -LiteralPath $archivePath -DestinationPath $runnerRoot -Force
}
& $pypyExe (Join-Path $PSScriptRoot 'testing_oj_runner.py') --pypy $pypyExe
