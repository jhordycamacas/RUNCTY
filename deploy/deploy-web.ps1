<#
.SYNOPSIS
  Builds the Angular web app (runner web + admin web) and deploys it to Firebase Hosting,
  together with the Firestore rules and indexes of project runcty-73d70.

.DESCRIPTION
  Every remote step asks for confirmation first. The script rewrites ONLY the apiBaseUrl line of
  frontend\src\environments\environment.prod.ts (it shows the change before writing) and never
  touches other keys. Idempotent: running it again with the same URL changes nothing in the file.

  Run it after deploy-backend.ps1:
    powershell -ExecutionPolicy Bypass -File deploy\deploy-web.ps1 -ApiUrl https://<service>.run.app
  Full guide (Spanish): docs\despliegue.md

.PARAMETER ApiUrl
  Origin of the Cloud Run service printed by deploy-backend.ps1 (no path; /api/v1 is appended).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    [string]$ProjectId = 'runcty-73d70'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. "$PSScriptRoot\common.ps1"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path $repoRoot 'frontend'
$envFile = Join-Path $frontendDir 'src\environments\environment.prod.ts'
$outputDir = Join-Path $frontendDir 'dist\runcty-frontend\browser'

# ---------------------------------------------------------------- prerequisites
Write-Step 'Checking prerequisites'
$ApiUrl = $ApiUrl.Trim().TrimEnd('/')
if ($ApiUrl -notmatch '^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d+)?$') {
    throw "ApiUrl must be an https origin without a path, for example https://runcty-api-123.southamerica-east1.run.app (got '$ApiUrl')."
}
if ($ApiUrl -like '*example.com*') { throw 'ApiUrl is a placeholder.' }
$apiBaseUrl = "$ApiUrl/api/v1"

Assert-Command 'node' 'Install Node.js 22 (see .nvmrc).'
Assert-Command 'npm.cmd' 'Install Node.js 22 (see .nvmrc).'
$firebase = 'firebase.cmd'
if (-not (Get-Command $firebase -ErrorAction SilentlyContinue)) { $firebase = 'firebase' }
Assert-Command $firebase 'Install the Firebase CLI: npm install -g firebase-tools, then firebase login.'
if (-not (Test-Path $envFile)) { throw "File not found: $envFile" }

Write-Host "Project:  $ProjectId"
Write-Host "API base: $apiBaseUrl"
if (-not (Confirm-Step 'Continue?')) { Write-Host 'Cancelled.'; return }

# ---------------------------------------------------------------- 1. environment.prod.ts
Write-Step '1. Set apiBaseUrl in environment.prod.ts (only that line)'
$content = [System.IO.File]::ReadAllText($envFile)
$pattern = "(?m)^(?<indent>[ \t]*)apiBaseUrl:\s*'(?<value>[^']*)',[ \t]*(?<eol>\r?)$"
$found = [regex]::Matches($content, $pattern)
if ($found.Count -ne 1) {
    throw "Expected exactly one apiBaseUrl line in environment.prod.ts, found $($found.Count). Edit it by hand."
}
$current = $found[0].Groups['value'].Value
if ($current -eq $apiBaseUrl) {
    Write-Host 'apiBaseUrl is already set; nothing to change.'
} else {
    Write-Host "- apiBaseUrl: '$current',"
    Write-Host "+ apiBaseUrl: '$apiBaseUrl',"
    if (-not (Confirm-Step 'Write this change to environment.prod.ts?')) { throw 'Cancelled: the build needs the real API URL.' }
    $replacement = '${indent}apiBaseUrl: ''' + $apiBaseUrl + ''',${eol}'
    $updated = [regex]::Replace($content, $pattern, $replacement)
    [System.IO.File]::WriteAllText($envFile, $updated, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host 'Updated. Review it with: git diff frontend/src/environments/environment.prod.ts'
}

# ---------------------------------------------------------------- 2. build
Write-Step '2. Production build (local, no remote calls except the npm registry)'
if (Confirm-Step 'Run npm ci and the production build in frontend\ ?') {
    Push-Location $frontendDir
    try {
        Invoke-Native 'npm.cmd' @('ci')
        Invoke-Native 'npx.cmd' @('ng', 'build', '--configuration', 'production')
    } finally {
        Pop-Location
    }
}
if (-not (Test-Path (Join-Path $outputDir 'index.html'))) {
    throw "Build output not found: $outputDir\index.html. Run the build step."
}
Write-Host "Build output: $outputDir"

# ---------------------------------------------------------------- 3. Firebase login check
Write-Step '3. Firebase CLI session (read-only)'
$projects = Get-NativeOutput $firebase @('projects:list', '--json')
if ($projects -notmatch [regex]::Escape("`"$ProjectId`"")) {
    throw "Project '$ProjectId' is not in 'firebase projects:list'. Run 'firebase login' with the owner account."
}
Write-Host "Logged in; project $ProjectId is visible."

# ---------------------------------------------------------------- 4. deploy
Write-Step '4. Deploy Hosting + Firestore rules and indexes'
Write-Host "Target: https://$ProjectId.web.app and https://$ProjectId.firebaseapp.com"
Write-Host 'Deploys: hosting (frontend\dist), firestore:rules (firestore.rules), firestore:indexes (firestore.indexes.json).'
if (Confirm-Step 'Run firebase deploy now?') {
    Push-Location $repoRoot
    try {
        Invoke-Native $firebase @('deploy', '--only', 'hosting,firestore:rules,firestore:indexes', '--project', $ProjectId)
    } finally {
        Pop-Location
    }
    Write-Host ''
    Write-Host "Web app: https://$ProjectId.web.app" -ForegroundColor Green
    Write-Host 'Indexes can take a few minutes to build; check the Firestore console if a query fails.'
} else {
    Write-Host 'Deploy skipped.'
}
