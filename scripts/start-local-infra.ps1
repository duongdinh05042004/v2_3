$ErrorActionPreference = 'Stop'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$pgData = Join-Path $PSScriptRoot '..\.data\pg'
$redisExe = 'C:\Program Files\Redis\redis-server.exe'
$redisCli = 'C:\Program Files\Redis\redis-cli.exe'

if (Test-Path $redisCli) {
  $pong = & $redisCli ping 2>$null
  if ($pong -ne 'PONG') {
    Start-Process -FilePath $redisExe -WindowStyle Hidden
    Start-Sleep -Seconds 1
  }
}

if (Test-Path "$pgBin\pg_ctl.exe") {
  $status = & "$pgBin\pg_ctl.exe" -D $pgData status 2>$null
  if ($LASTEXITCODE -ne 0) {
    & "$pgBin\pg_ctl.exe" -D $pgData -l (Join-Path $PSScriptRoot '..\.data\pg.log') start
  }
}

Write-Host 'Redis and local Postgres are ready.'
