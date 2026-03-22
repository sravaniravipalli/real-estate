param(
  [Parameter(Mandatory = $false)]
  [string]$BaseUrl = $env:VITE_REACT_API_URL
)

if (-not $BaseUrl) {
  $BaseUrl = "https://real-estate-production-1eda.up.railway.app"
}

$BaseUrl = $BaseUrl.Trim().TrimEnd("/")

$email = "testuser_{0}@example.com" -f ([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
$password = "Test@1234A"
$displayName = "Test User"

Write-Host "BaseUrl: $BaseUrl"
Write-Host "Registering: $email"

$registerBody = @{
  email = $email
  password = $password
  displayName = $displayName
} | ConvertTo-Json

$reg = $null
try {
  $reg = Invoke-RestMethod -Method Post -Uri "$BaseUrl/register" -ContentType "application/json" -Body $registerBody -ErrorAction Stop
} catch {
  Write-Host "Register failed."
  try {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "status=$status"
  } catch {}
  try {
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Write-Host $errBody }
  } catch {}
  try {
    if ($_.Exception.Response) {
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $sr.ReadToEnd()
      if ($raw) { Write-Host $raw }
    }
  } catch {}
  exit 1
}

if (-not $reg.access_token) {
  Write-Host "Register response did not include access_token:"
  $reg | ConvertTo-Json -Depth 10
  exit 1
}

Write-Host "Registered user id: $($reg.user.id)"

Write-Host "Logging in: $email"
$loginBody = @{
  email = $email
  password = $password
} | ConvertTo-Json

$login = $null
try {
  $login = Invoke-RestMethod -Method Post -Uri "$BaseUrl/login" -ContentType "application/json" -Body $loginBody -ErrorAction Stop
} catch {
  Write-Host "Login failed."
  try {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "status=$status"
  } catch {}
  try {
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Write-Host $errBody }
  } catch {}
  try {
    if ($_.Exception.Response) {
      $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $raw = $sr.ReadToEnd()
      if ($raw) { Write-Host $raw }
    }
  } catch {}
  exit 1
}

if (-not $login.access_token) {
  Write-Host "Login response did not include access_token:"
  $login | ConvertTo-Json -Depth 10
  exit 1
}

Write-Host "Calling /me with JWT..."
$headers = @{
  Authorization = "Bearer $($login.access_token)"
}

$me = Invoke-RestMethod -Method Get -Uri "$BaseUrl/me" -Headers $headers

Write-Host "OK:"
$me | ConvertTo-Json -Depth 10
