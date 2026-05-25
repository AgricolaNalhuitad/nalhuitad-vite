# Stop hook — format and lint files changed in this session
# Runs once when Claude finishes responding. Cero overhead si nada cambió.
$ErrorActionPreference = 'SilentlyContinue'

$projectDir = $env:CLAUDE_PROJECT_DIR
if (-not $projectDir) { $projectDir = (Get-Location).Path }
Set-Location $projectDir

# Files changed since HEAD (staged + unstaged). Filter to known formattable types.
$changed = git diff --name-only --diff-filter=ACMR HEAD 2>$null |
  Where-Object { $_ -and ($_ -match '\.(ts|tsx|css|md|json)$') -and ($_ -notmatch 'node_modules') }

if (-not $changed) { exit 0 }

$formattable = @($changed)
$lintable = @($changed | Where-Object { $_ -match '\.(ts|tsx)$' })

# Prettier on all formattable files (silent on success)
try {
  & pnpm exec prettier --write --log-level warn @formattable 2>&1 | Out-Null
} catch {}

# ESLint --fix only on TS/TSX (silent unless real error)
if ($lintable.Count -gt 0) {
  try {
    & pnpm exec eslint --fix --quiet @lintable 2>&1 | Out-Null
  } catch {}
}

exit 0
