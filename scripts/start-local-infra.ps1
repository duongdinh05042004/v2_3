# Deprecated: use Docker instead (works on Windows / macOS / Linux).
#   npm run infra:up
# or
#   docker compose up -d postgres redis
#
# This script only forwards to the portable Node wrapper.

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
node scripts/infra-docker.js up
