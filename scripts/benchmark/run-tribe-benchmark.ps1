Param(
    [string]$InputReviews = "scripts/benchmark/fixtures/tribe-reviews.input.json",
    [string]$ToolSlug = "tribe-y-code-review",
    [switch]$SkipStep1
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
Write-Host "[tribe-benchmark] Using uv: $uv"

Push-Location $repoRoot
try {
    Write-Host "[tribe-benchmark] Merging tribe reviews into benchmark_data.json..."
    Invoke-Checked -Exe "node" -CommandArgs @(
        "scripts/benchmark/convert-tribe-reviews.mjs",
        "--input", $InputReviews,
        "--merge", "resources/code-review-benchmark/offline/results/benchmark_data.json",
        "--output", "resources/code-review-benchmark/offline/results/benchmark_data.json",
        "--tool", $ToolSlug
    ) -StepName "convert-tribe-reviews"
}
finally {
    Pop-Location
}

Push-Location $offlineDir
try {
    $env:PYTHONUTF8 = "1"

    Write-Host "[tribe-benchmark] Syncing benchmark dependencies..."
    Invoke-Checked -Exe $uv -CommandArgs @("sync") -StepName "uv sync"

    if (-not $SkipStep1) {
        Write-Host "[tribe-benchmark] Refreshing benchmark data with step1 --test..."
        Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step1_download_prs", "--output", "results/benchmark_data.json", "--test") -StepName "step1_download_prs"
    }

    Write-Host "[tribe-benchmark] Running step2 extraction for $ToolSlug..."
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step2_extract_comments", "--tool", $ToolSlug, "--force") -StepName "step2_extract_comments"

    Write-Host "[tribe-benchmark] Running step2.5 dedup for $ToolSlug..."
    Invoke-Checked -Exe $uv -CommandArgs @("run", "python", "-m", "code_review_benchmark.step2_5_dedup_candidates", "--tool", $ToolSlug, "--force") -StepName "step2_5_dedup_candidates"

    Write-Host "[tribe-benchmark] Running step3 judge for $ToolSlug..."
    Invoke-Checked -Exe $uv -CommandArgs @(
        "run", "python", "-m", "code_review_benchmark.step3_judge_comments",
        "--tool", $ToolSlug,
        "--force",
        "--dedup-groups", "results/openai_gpt-4o-mini/dedup_groups.json"
    ) -StepName "step3_judge_comments"
}
finally {
    Pop-Location
}

Push-Location $repoRoot
try {
    Write-Host "[tribe-benchmark] Exporting confidence artifact for app..."
    Invoke-Checked -Exe "node" -CommandArgs @(
        "scripts/benchmark/export-confidence.mjs",
        "--tool", $ToolSlug,
        "--evaluations", "resources/code-review-benchmark/offline/results/openai_gpt-4o-mini/evaluations.json",
        "--output", "src/agents/benchmarkConfidence.generated.json"
    ) -StepName "export-confidence"
}
finally {
    Pop-Location
}

Write-Host "[tribe-benchmark] Completed targeted benchmark run for $ToolSlug"
