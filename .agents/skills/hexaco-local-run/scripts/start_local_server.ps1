[CmdletBinding()]
param(
  [ValidateRange(1, 65535)]
  [int]$Port = 5173,
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\..\.."))
$distRoot = Join-Path $projectRoot "dist"
$indexPath = Join-Path $distRoot "index.html"
$url = "http://127.0.0.1:$Port/"

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot "package.json") -PathType Leaf)) {
  throw "The HEXACO project root could not be resolved from: $PSScriptRoot"
}

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
  throw "Build output was not found: $indexPath"
}

function Test-HexacoServer {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return $response.StatusCode -eq 200 -and $response.Content -match "HEXACO"
  } catch {
    return $false
  }
}

if (Test-HexacoServer) {
  if ($OpenBrowser) {
    Start-Process $url
  }

  [pscustomobject]@{
    Status = "AlreadyRunning"
    Url = $url
    ProcessId = $null
    ProjectRoot = $projectRoot
    OutputLog = $null
    ErrorLog = $null
  }
  exit 0
}

$python = $null
$pythonArguments = @()
$pyLauncher = Get-Command py.exe -ErrorAction SilentlyContinue

if ($pyLauncher) {
  $python = $pyLauncher.Source
  $pythonArguments = @("-3")
} else {
  foreach ($commandName in @("python.exe", "python3.exe")) {
    $command = Get-Command $commandName -ErrorAction SilentlyContinue
    if ($command) {
      $python = $command.Source
      break
    }
  }
}

if (-not $python) {
  $unityPython = "C:\Program Files\Unity\Hub\Editor\2022.3.44f1\Editor\Data\PlaybackEngines\WebGLSupport\BuildTools\Emscripten\python\python.exe"
  if (Test-Path -LiteralPath $unityPython -PathType Leaf) {
    $python = $unityPython
  }
}

if (-not $python) {
  throw "Python was not found. Install Python 3 or run the project with pnpm run dev."
}

$logRoot = Join-Path ([System.IO.Path]::GetTempPath()) "codex-hexaco-local-run"
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
$outputLog = Join-Path $logRoot "$stamp.out.log"
$errorLog = Join-Path $logRoot "$stamp.err.log"
$pythonArguments += @("-m", "http.server", "$Port", "--bind", "127.0.0.1")

$process = Start-Process `
  -FilePath $python `
  -ArgumentList $pythonArguments `
  -WorkingDirectory $distRoot `
  -RedirectStandardOutput $outputLog `
  -RedirectStandardError $errorLog `
  -WindowStyle Hidden `
  -PassThru

$ready = $false
foreach ($attempt in 1..20) {
  Start-Sleep -Milliseconds 250
  if (Test-HexacoServer) {
    $ready = $true
    break
  }
  if ($process.HasExited) {
    break
  }
}

if (-not $ready) {
  if (-not $process.HasExited) {
    Stop-Process -Id $process.Id -Force
  }
  $details = if (Test-Path -LiteralPath $errorLog) { Get-Content -Raw -LiteralPath $errorLog } else { "No error log." }
  throw "The local server did not become ready. $details"
}

if ($OpenBrowser) {
  Start-Process $url
}

[pscustomobject]@{
  Status = "Started"
  Url = $url
  ProcessId = $process.Id
  ProjectRoot = $projectRoot
  OutputLog = $outputLog
  ErrorLog = $errorLog
}
