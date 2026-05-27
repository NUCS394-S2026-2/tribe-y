Param(
    [switch]$SkipStep1,
    [switch]$SkipJudge,
    [string]$OutputFile = "results/benchmark_data.json"
)

$ErrorActionPreference = 'Stop'

function Resolve-UvPath {
    $uvCmd = Get-Command uv -ErrorAction SilentlyContinue
    if ($uvCmd) {
        return $uvCmd.Source
    }

    $fallback = "C:\Users\$env:USERNAME\AppData\Local\Microsoft\WinGet\Packages\astral-sh.uv_Microsoft.Winget.Source_8wekyb3d8bbwe\uv.exe"
    if (Test-Path $fallback) {
        return $fallback
    }

    throw "uv not found. Install with: winget install --id=astral-sh.uv -e"
}

function Get-EnvValueFromDotEnv {
    param(
        [string]$FilePath,
        [string]$Key
    )

    if (-not (Test-Path $FilePath)) {
        return ""
    }

    $line = Get-Content $FilePath |
        Where-Object { $_ -match "^\s*$Key\s*=" } |
        Select-Object -First 1

    if (-not $line) {
        return ""
    }

    return ($line -replace "^\s*$Key\s*=\s*", "").Trim().Trim('"').Trim("'")
}

function Ensure-GhAuth {
    if ($env:GH_TOKEN -and $env:GH_TOKEN -notmatch "^ghp_x") {
        return
    }

    $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
    if (-not $ghCmd) {
        throw "gh CLI not found. Install GitHub CLI first."
    }

    $status = gh auth status --hostname github.com 2>&1
    $statusText = ($status | Out-String)
    if ($LASTEXITCODE -ne 0 -or $statusText -match "not logged" -or $statusText -match "not authenticated") {
        throw "GitHub CLI is not authenticated. Run: gh auth login"
    }
}

function Invoke-Checked {
    param(
        [string]$Exe,
        [string[]]$CommandArgs,
        [string]$StepName
    )

    & $Exe @CommandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed ($StepName) with exit code $LASTEXITCODE"
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$offlineDir = Join-Path $repoRoot "resources\code-review-benchmark\offline"
if (-not (Test-Path $offlineDir)) {
    throw "Missing benchmark offline dir: $offlineDir"
}

$uv = Resolve-UvPath
Write-Host "[benchmark] Using uv: $uv"

Push-Location $offlineDir
try {
    $env:PYTHONUTF8 = "1"

    Write-Host "[benchmark] Syncing Python dependencies..."
    Invoke-Checked -Exe $uv -CommandArgs @("sync") -StepName "uv sync"

    if (-not $SkipStep1) {
        Write-Host "[benchmark] Running step1 download in --test mode..."
        Ensure-GhAuth
        Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step1_download_prs", "--output", $OutputFile, "--test") -StepName "step1_download_prs"
    } else {
        Write-Host "[benchmark] Skipping step1 (requested)."
    }

    if ($SkipJudge) {
        Write-Host "[benchmark] Skipping judge pipeline (requested)."
        return
    }

    $martianKey = if ($env:MARTIAN_API_KEY) {
        $env:MARTIAN_API_KEY
    } else {
        Get-EnvValueFromDotEnv -FilePath ".env" -Key "MARTIAN_API_KEY"
    }

    if (-not $martianKey -or $martianKey -match "^sk-x" -or $martianKey -match "^\s*$") {
        throw "MARTIAN_API_KEY is missing or placeholder in offline/.env"
    }

    Write-Host "[benchmark] Running step2 extraction..."
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step2_extract_comments") -StepName "step2_extract_comments"

    Write-Host "[benchmark] Running step2.5 dedup..."
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step2_5_dedup_candidates") -StepName "step2_5_dedup_candidates"

    $model = if ($env:MARTIAN_MODEL) { $env:MARTIAN_MODEL } else { Get-EnvValueFromDotEnv -FilePath ".env" -Key "MARTIAN_MODEL" }
    if (-not $model) { $model = "openai/gpt-4o-mini" }
    $modelDir = $model.Replace('/', '_')
    $dedupPath = "results/$modelDir/dedup_groups.json"

    Write-Host "[benchmark] Running step3 judge..."
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step3_judge_comments", "--dedup-groups", $dedupPath) -StepName "step3_judge_comments"

    Write-Host "[benchmark] Building dashboard + summary..."
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "analysis/benchmark_dashboard.py") -StepName "benchmark_dashboard"
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.summary_table") -StepName "summary_table"

    Write-Host "[benchmark] Done. Outputs:"
    Write-Host "  - $offlineDir\results"
    Write-Host "  - $offlineDir\analysis\benchmark_dashboard.html"
}
finally {
    Pop-Location
}
