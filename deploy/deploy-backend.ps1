<#
.SYNOPSIS
  Deploys the RUNCTY Django API to Google Cloud Run (project runcty-73d70) with least privilege.

.DESCRIPTION
  Every remote step asks for confirmation first. The script is idempotent: running it again
  reuses the service account, the secret and the IAM bindings, and creates a new revision.
  It never prints secrets and never reads .env or service-account key files.

  Run it from any folder:   powershell -ExecutionPolicy Bypass -File deploy\deploy-backend.ps1
  Full guide (Spanish):     docs\despliegue.md

.PARAMETER WebOrigins
  Exact origins allowed by CORS (the Firebase Hosting domains of the web app).

.PARAMETER GrantBuildPermissions
  Also grants roles/cloudbuild.builds.builder to the default Compute Engine service account.
  Only needed when the source build fails with a permission error (new projects).
#>
[CmdletBinding()]
param(
    [string]$ProjectId = 'runcty-73d70',
    [string]$Region = 'southamerica-east1',
    [string]$ServiceName = 'runcty-api',
    [string]$StorageBucket = 'runcty-73d70.firebasestorage.app',
    [string[]]$WebOrigins = @('https://runcty-73d70.web.app', 'https://runcty-73d70.firebaseapp.com'),
    [int]$MaxInstances = 3,
    [switch]$GrantBuildPermissions
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
. "$PSScriptRoot\common.ps1"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$serviceAccountName = 'runcty-api'
$serviceAccountEmail = "$serviceAccountName@$ProjectId.iam.gserviceaccount.com"
$secretName = 'runcty-django-secret-key'

# ---------------------------------------------------------------- prerequisites
Write-Step 'Checking prerequisites (read-only)'
Assert-Command 'gcloud' 'Install the Google Cloud CLI: https://cloud.google.com/sdk/docs/install'
if (-not (Test-Path (Join-Path $backendDir 'Dockerfile'))) { throw "backend\Dockerfile not found under $repoRoot." }

$account = Get-NativeOutput 'gcloud' @('auth', 'list', '--filter=status:ACTIVE', '--format=value(account)')
if (-not $account) { throw "No active gcloud account. Run 'gcloud auth login' first." }
Write-Host "gcloud account: $account"

if (-not (Test-Native 'gcloud' @('projects', 'describe', $ProjectId))) {
    throw "Project '$ProjectId' is not visible to this account."
}
$projectNumber = Get-NativeOutput 'gcloud' @('projects', 'describe', $ProjectId, '--format=value(projectNumber)')
$billing = Get-NativeOutput 'gcloud' @('billing', 'projects', 'describe', $ProjectId, '--format=value(billingEnabled)')
if ($billing -ne 'True') {
    throw "Billing is not enabled on '$ProjectId'. Cloud Run needs the Blaze/billing account: https://console.cloud.google.com/billing"
}
Write-Host "Project $ProjectId (number $projectNumber), region $Region, billing enabled."

if (-not (Confirm-Step "Deploy the API of project '$ProjectId' to Cloud Run service '$ServiceName' in '$Region'?")) {
    Write-Host 'Cancelled.'
    return
}

# ---------------------------------------------------------------- 1. APIs
Write-Step '1. Enable the required Google APIs'
$apis = @(
    'run.googleapis.com',                  # Cloud Run: runs the container
    'cloudbuild.googleapis.com',           # Cloud Build: builds the image from the source
    'artifactregistry.googleapis.com',     # Artifact Registry: stores the image
    'secretmanager.googleapis.com',        # Secret Manager: holds DJANGO_SECRET_KEY
    'firestore.googleapis.com',            # Firestore: the data store
    'identitytoolkit.googleapis.com',      # Firebase Authentication (users and custom claims)
    'iam.googleapis.com',                  # service accounts
    'cloudresourcemanager.googleapis.com'  # project-level IAM bindings
)
Write-Host ($apis -join "`n")
if (Confirm-Step 'Enable these APIs (idempotent)?') {
    Invoke-Native 'gcloud' (@('services', 'enable') + $apis + @('--project', $ProjectId))
}

# ---------------------------------------------------------------- 2. runtime service account
Write-Step "2. Runtime service account $serviceAccountEmail (least privilege)"
Write-Host 'Roles that will be granted at project level (nothing else):'
Write-Host '  roles/datastore.user      read and write Firestore documents (the API is the only writer)'
Write-Host '  roles/firebaseauth.admin  set custom claims, revoke refresh tokens, delete users, look up users'
Write-Host 'Not granted: Storage (the code does not use the bucket yet), Editor/Owner, Messaging (not used yet).'
if (Confirm-Step 'Create the service account (if missing) and grant those roles?') {
    if (-not (Test-Native 'gcloud' @('iam', 'service-accounts', 'describe', $serviceAccountEmail, '--project', $ProjectId))) {
        Invoke-Native 'gcloud' @('iam', 'service-accounts', 'create', $serviceAccountName,
            '--display-name', 'RUNCTY API runtime', '--project', $ProjectId)
        # IAM is eventually consistent: wait until the new account is visible before binding it.
        $ready = $false
        for ($i = 0; $i -lt 10 -and -not $ready; $i++) {
            Start-Sleep -Seconds 3
            $ready = Test-Native 'gcloud' @('iam', 'service-accounts', 'describe', $serviceAccountEmail, '--project', $ProjectId)
        }
        if (-not $ready) { throw 'The service account is not visible yet. Run the script again in a minute.' }
    } else {
        Write-Host 'Service account already exists.'
    }
    foreach ($role in @('roles/datastore.user', 'roles/firebaseauth.admin')) {
        Invoke-Native 'gcloud' @('projects', 'add-iam-policy-binding', $ProjectId,
            '--member', "serviceAccount:$serviceAccountEmail", '--role', $role,
            '--condition=None', '--quiet') | Out-Null
    }
}

# ---------------------------------------------------------------- 3. secret
Write-Step "3. Secret Manager: $secretName (DJANGO_SECRET_KEY)"
if (Confirm-Step 'Create the secret with a random value (skipped if it already exists) and let the service account read it?') {
    $secretExists = Test-Native 'gcloud' @('secrets', 'describe', $secretName, '--project', $ProjectId)
    if ($secretExists) {
        Write-Host 'The secret already exists: its value is kept (no rotation).'
    } else {
        $bytes = New-Object 'byte[]' 48
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        $value = -join ($bytes | ForEach-Object { $_.ToString('x2') })
        $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
        try {
            # No trailing newline: the file holds exactly the key. Deleted right after the upload.
            [System.IO.File]::WriteAllText($tmp, $value, [System.Text.Encoding]::ASCII)
            Invoke-Native 'gcloud' @('secrets', 'create', $secretName, '--data-file', $tmp,
                '--replication-policy', 'automatic', '--project', $ProjectId)
        } finally {
            if (Test-Path $tmp) { Remove-Item -Force $tmp }
            $value = $null
        }
        Write-Host 'Secret created (value not shown).'
    }
    Invoke-Native 'gcloud' @('secrets', 'add-iam-policy-binding', $secretName,
        '--member', "serviceAccount:$serviceAccountEmail", '--role', 'roles/secretmanager.secretAccessor',
        '--project', $ProjectId, '--quiet') | Out-Null
}

# ---------------------------------------------------------------- 4. optional build permissions
if ($GrantBuildPermissions) {
    Write-Step '4. Build permissions for the default Compute Engine service account'
    $computeSa = "$projectNumber-compute@developer.gserviceaccount.com"
    if (Confirm-Step "Grant roles/cloudbuild.builds.builder to $computeSa (needed by source builds on new projects)?") {
        Invoke-Native 'gcloud' @('projects', 'add-iam-policy-binding', $ProjectId,
            '--member', "serviceAccount:$computeSa", '--role', 'roles/cloudbuild.builds.builder',
            '--condition=None', '--quiet') | Out-Null
    }
}

# ---------------------------------------------------------------- 5. deploy
Write-Step "5. Build and deploy the Cloud Run service '$ServiceName'"
# Deterministic Cloud Run host; the real URL is checked after the deploy and added if it differs.
$expectedHost = "$ServiceName-$projectNumber.$Region.run.app"
$origins = $WebOrigins -join ','
# "^@^" makes "@" the separator between variables, so the comma lists below stay intact.
$envVars = "^@^FIREBASE_PROJECT_ID=$ProjectId@FIREBASE_STORAGE_BUCKET=$StorageBucket" +
    "@DJANGO_ALLOWED_HOSTS=$expectedHost@CORS_ALLOWED_ORIGINS=$origins" +
    '@DJANGO_NUM_PROXIES=1@WEB_CONCURRENCY=1@GUNICORN_THREADS=8'

Write-Host 'Service settings:'
Write-Host "  region              $Region"
Write-Host "  service account     $serviceAccountEmail"
Write-Host '  env vars            FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, DJANGO_ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS,'
Write-Host '                      DJANGO_NUM_PROXIES=1, WEB_CONCURRENCY=1, GUNICORN_THREADS=8'
Write-Host "  secret              DJANGO_SECRET_KEY <- ${secretName}:latest"
Write-Host "  CORS origins        $origins"
Write-Host "  instances           min 0, max $MaxInstances; 1 vCPU, 512Mi, concurrency 16, timeout 60s"
Write-Host '  access              public (--allow-unauthenticated): the API checks the Firebase ID token itself'
Write-Host '  NOT set             DJANGO_DEBUG, *_EMULATOR_HOST, GOOGLE_APPLICATION_CREDENTIALS (no key files)'
Write-Host 'Only manage.py, config/, apps/, requirements.txt and the Dockerfile are uploaded (a clean copy).'

if (Confirm-Step 'Build the image in Cloud Build and deploy it?') {
    $stage = Join-Path ([System.IO.Path]::GetTempPath()) ('runcty-api-src-' + [System.IO.Path]::GetRandomFileName())
    try {
        New-Item -ItemType Directory -Path $stage | Out-Null
        foreach ($file in @('Dockerfile', 'requirements.txt', 'manage.py')) {
            Copy-Item (Join-Path $backendDir $file) $stage
        }
        foreach ($dir in @('config', 'apps')) {
            & robocopy (Join-Path $backendDir $dir) (Join-Path $stage $dir) /E /XD __pycache__ /XF *.pyc /NFL /NDL /NJH /NJS /NP | Out-Null
            if ($LASTEXITCODE -ge 8) { throw "robocopy failed copying '$dir' (exit code $LASTEXITCODE)." }
        }
        # Safety net: refuse to upload anything that looks like a secret.
        $suspect = @(Get-ChildItem -Path $stage -Recurse -Force -File |
            Where-Object { $_.Name -like '.env*' -or $_.Name -like '*.json' -or $_.Name -like '*.pem' -or $_.Name -like '*.key' })
        if ($suspect.Count -gt 0) {
            throw "Refusing to upload: suspicious files in the build context: $($suspect.FullName -join ', ')"
        }

        Invoke-Native 'gcloud' @('run', 'deploy', $ServiceName,
            '--source', $stage,
            '--project', $ProjectId, '--region', $Region,
            '--service-account', $serviceAccountEmail,
            '--allow-unauthenticated',
            '--port', '8080',
            '--set-env-vars', $envVars,
            '--set-secrets', "DJANGO_SECRET_KEY=${secretName}:latest",
            '--min-instances', '0', '--max-instances', "$MaxInstances",
            '--memory', '512Mi', '--cpu', '1', '--cpu-boost',
            '--concurrency', '16', '--timeout', '60',
            '--quiet')
    } finally {
        if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
    }

    $serviceUrl = Get-NativeOutput 'gcloud' @('run', 'services', 'describe', $ServiceName,
        '--project', $ProjectId, '--region', $Region, '--format=value(status.url)')
    $serviceHost = ([System.Uri]$serviceUrl).Host
    if ($serviceHost -ne $expectedHost) {
        Write-Host "The service URL host differs from the expected one; adding $serviceHost to DJANGO_ALLOWED_HOSTS."
        Invoke-Native 'gcloud' @('run', 'services', 'update', $ServiceName,
            '--project', $ProjectId, '--region', $Region,
            '--update-env-vars', "^@^DJANGO_ALLOWED_HOSTS=$expectedHost,$serviceHost", '--quiet')
    }

    Write-Host ''
    Write-Host "Service URL: $serviceUrl" -ForegroundColor Green
    Write-Host "Health check: $serviceUrl/api/v1/health"

    # ------------------------------------------------------------ 6. smoke test
    Write-Step '6. Smoke test'
    if (Confirm-Step 'Call GET /api/v1/health on the deployed service?') {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "$serviceUrl/api/v1/health" -TimeoutSec 60
        Write-Host "HTTP $($response.StatusCode): $($response.Content)"
    }
    Write-Host ''
    Write-Host 'Next: deploy the web app with'
    Write-Host "  powershell -ExecutionPolicy Bypass -File deploy\deploy-web.ps1 -ApiUrl $serviceUrl"
} else {
    Write-Host 'Deploy skipped.'
}
