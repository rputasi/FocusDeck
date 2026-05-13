$watcher = $null
try {
    $cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $cacheDir
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $action = {
        $path = $Event.SourceEventArgs.FullPath
        if ($path -match 'darwin\\10\.12\\lib\\(libcrypto|libssl)\.dylib$' -and (Test-Path $path) -and ((Get-Item $path).Length -eq 0)) {
            $libDir = Split-Path $path -Parent
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($path)
            $realFile = Join-Path $libDir "$baseName.1.0.0.dylib"
            if (Test-Path $realFile) {
                Copy-Item -LiteralPath $realFile -Destination $path -Force
                Write-Host "Fixed: $path"
            }
        }
    }

    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null

    Write-Host "Watcher started. Running npm run dist..."
    $p = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dist" -WorkingDirectory "C:\KERJAAN\todolistdesktop" -Wait -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\dist_out.txt" -RedirectStandardError "$env:TEMP\dist_err.txt"
    Write-Host "Exit code: $($p.ExitCode)"
    Get-Content "$env:TEMP\dist_out.txt" | Write-Host
    if ((Get-Content "$env:TEMP\dist_err.txt").Length -gt 0) {
        Write-Host "=== STDERR ==="
        Get-Content "$env:TEMP\dist_err.txt" | Write-Host
    }
} finally {
    if ($watcher) { $watcher.EnableRaisingEvents = $false; $watcher.Dispose() }
    Get-EventSubscriber | Unregister-Event -Force -ErrorAction SilentlyContinue
}
