param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = $env:VITE_REACT_API_URL
)

if (-not $BaseUrl) {
  $BaseUrl = "https://real-estate-production-1eda.up.railway.app"
}

$BaseUrl = $BaseUrl.Trim().TrimEnd("/")

Write-Host "BaseUrl: $BaseUrl"

Write-Host "`n1) Checking /healthz ..."
try {
  $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/healthz"
  $healthJson = $health | ConvertTo-Json -Depth 10
  Write-Host $healthJson

  if (-not $health.db_ok) {
    Write-Warning "Database check failed (db_ok=false). Check Railway DATABASE_URL and redeploy backend."
  } elseif ($health.db -ne "postgresql") {
    Write-Warning "Backend is not using Postgres (db=$($health.db)). If deployed, set DATABASE_URL (Railway Postgres) and redeploy."
  } else {
    Write-Host "OK: Backend is connected to Postgres."
  }
} catch {
  Write-Warning "Failed to call $BaseUrl/healthz. Is the backend deployed and public?"
  throw
}

Write-Host "`n2) Checking auth flow (/register -> /login -> /me) ..."
& "$PSScriptRoot/verify_backend_auth.ps1" -BaseUrl $BaseUrl

