Param(
    [switch]$SkipSync
)

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$targetDir = Join-Path $repoRoot "resources\code-review-benchmark"
$repoUrl = "https://github.com/withmartian/code-review-benchmark.git"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

function Test-Command {
    param([string]$Name)

    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "[bootstrap] Verifying required commands..."
Require-Command "git"

$hasUv = Test-Command "uv"
$hasGh = Test-Command "gh"

if (-not $hasUv) {
    Write-Warning "Optional command not found: uv"
}

if (-not $hasGh) {
    Write-Warning "Optional command not found: gh"
}

if (-not (Test-Path $targetDir)) {
    if ($SkipSync) {
        throw "Target not found and -SkipSync was provided: $targetDir"
    }

    Write-Host "[bootstrap] Cloning benchmark repo to $targetDir"
    git clone $repoUrl $targetDir
} else {
    Write-Host "[bootstrap] Found benchmark repo at $targetDir"
    if (-not $SkipSync) {
        Write-Host "[bootstrap] Pulling latest main..."
        git -C $targetDir fetch origin
        git -C $targetDir checkout main
        git -C $targetDir pull --ff-only origin main
    }
}

$offlineDir = Join-Path $targetDir "offline"
$envExample = Join-Path $offlineDir ".env.example"
$envFile = Join-Path $offlineDir ".env"

if (-not (Test-Path $envFile)) {
    if (-not (Test-Path $envExample)) {
        throw "Expected file not found: $envExample"
    }

    Copy-Item $envExample $envFile
    Write-Host "[bootstrap] Created $envFile from .env.example"
    Write-Host "[bootstrap] Fill in credentials before running pipeline."
} else {
    Write-Host "[bootstrap] Found existing $envFile"
}

Write-Host ""
Write-Host "[bootstrap] Ready. Next commands:"
Write-Host "  cd resources/code-review-benchmark/offline"

if ($hasUv) {
    Write-Host "  uv sync"
    Write-Host "  uv run python -m code_review_benchmark.step1_download_prs --output results/benchmark_data.json --test"
} else {
    Write-Host "  Install uv first: https://docs.astral.sh/uv/getting-started/installation/"
}
