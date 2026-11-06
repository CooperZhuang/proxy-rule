# ccsub 订阅开关（Clash Verge / mihomo）
# 用法: ccsub-switch.ps1 on|off|status
# off: 注释掉 ccsub provider 与 GitHub/高倍节点 规则，热重载
# on : 还原
param([ValidateSet('on','off','status')][string]$Action = 'status')

$ErrorActionPreference = 'Stop'
$base = "$env:APPDATA\io.github.clash-verge-rev.clash-verge-rev"
$prof = "$base\profiles\LAAJARtbj1tb.yaml"
$rt   = "C:\ProgramData\clash-verge-service\users\cb61573cd290953c79572af3dbed25eb103ba22fa3d541f33221890c66f7a16c\runtime\config.yaml"
$marker = '#CCSUBOFF# '
$h = @{ Authorization = 'Bearer @Cooper' }

function Apply-Off([string]$path) {
  $lines = Get-Content $path
  $out = New-Object System.Collections.Generic.List[string]
  $inCcsub = $false
  foreach ($ln in $lines) {
    if ($ln.StartsWith($marker)) { $out.Add($ln); continue }
    if (-not $inCcsub -and $ln -match '^  ccsub:$') { $inCcsub = $true; $out.Add($marker + $ln); continue }
    if ($inCcsub) {
      if ($ln -match '^  eco:') { $inCcsub = $false; $out.Add($ln); continue }
      $out.Add($marker + $ln); continue
    }
    if ($ln -match ',🐙 GitHub\s*$' -or $ln -match ',⚡ 高倍节点\s*$') { $out.Add($marker + $ln); continue }
    $out.Add($ln)
  }
  Set-Content -Path $path -Value ($out -join "`n") -NoNewline -Encoding UTF8
}

function Apply-On([string]$path) {
  $lines = Get-Content $path
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($ln in $lines) {
    if ($ln.StartsWith($marker)) { $out.Add($ln.Substring($marker.Length)) }
    else { $out.Add($ln) }
  }
  Set-Content -Path $path -Value ($out -join "`n") -NoNewline -Encoding UTF8
}

function Reload {
  $body = @{ path = $rt } | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Put -Uri 'http://127.0.0.1:9097/configs?force=true' -Headers $h -Body $body -ContentType 'application/json' -TimeoutSec 30 | Out-Null
}

switch ($Action) {
  'off' {
    Apply-Off $prof
    Apply-Off $rt
    $test = & "C:\ProgramData\clash-verge-service\cores\verge-mihomo.exe" -t -d (Split-Path $rt) -f $rt 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Output "TEST FAILED"; $test | Select-Object -Last 3; exit 1 }
    Reload
    Write-Output "ccsub: OFF"
  }
  'on' {
    Apply-On $prof
    Apply-On $rt
    Reload
    Write-Output "ccsub: ON"
  }
  'status' {
    $n = @(Select-String -Path $rt -Pattern ([regex]::Escape($marker)) -ErrorAction SilentlyContinue).Count
    if ($n -gt 0) { Write-Output "ccsub: OFF ($n marked lines)" } else { Write-Output "ccsub: ON" }
  }
}
