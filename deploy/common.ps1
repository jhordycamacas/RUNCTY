# Shared helpers for the deployment scripts. Dot-source it: . "$PSScriptRoot\common.ps1"
# Windows PowerShell 5.1 compatible. Keep this file ASCII-only.

function Write-Step([string]$Message) {
    Write-Host ''
    Write-Host "== $Message" -ForegroundColor Cyan
}

# Asks before every remote action. Anything other than "y" or "yes" skips the step.
function Confirm-Step([string]$Question) {
    $answer = Read-Host "$Question [y/N]"
    return ($answer -match '^(y|yes)$')
}

function Assert-Command([string]$Name, [string]$Hint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "'$Name' was not found in PATH. $Hint"
    }
}

# Runs a native command and stops the script on a non-zero exit code. Do not redirect stderr
# here: in Windows PowerShell 5.1 that turns tool progress output into terminating errors.
function Invoke-Native([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "'$Command' failed with exit code $LASTEXITCODE."
    }
}

# Runs a native command and returns its trimmed stdout. Stops on a non-zero exit code.
function Get-NativeOutput([string]$Command, [string[]]$Arguments) {
    $output = & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "'$Command' failed with exit code $LASTEXITCODE."
    }
    return (($output | Out-String).Trim())
}

# True when the command exits with code 0 (used for "does this resource exist?" checks).
function Test-Native([string]$Command, [string[]]$Arguments) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command @Arguments *> $null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previous
    }
}
