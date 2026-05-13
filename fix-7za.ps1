$7zaReal = "C:\KERJAAN\todolistdesktop\node_modules\7zip-bin\win\x64\7za.exe"
$7zaBak = "C:\KERJAAN\todolistdesktop\node_modules\7zip-bin\win\x64\7za_real.exe"
if (-not (Test-Path $7zaBak)) {
    Rename-Item -LiteralPath $7zaReal -NewName "7za_real.exe" -Force
}

@"
@echo off
""%~dp0\\7za_real.exe"" %*
if %ERRORLEVEL% NEQ 0 (
    for /f %%d in ('dir /ad /b "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\*" 2^>nul') do (
        if exist "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libcrypto.1.0.0.dylib" (
            if not exist "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libcrypto.dylib" (
                copy /Y "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libcrypto.1.0.0.dylib" "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libcrypto.dylib" >nul
            )
            if not exist "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libssl.dylib" (
                copy /Y "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libssl.1.0.0.dylib" "%LOCALAPPDATA%\\electron-builder\\Cache\\winCodeSign\\%%d\\darwin\\10.12\\lib\\libssl.dylib" >nul
            )
        )
    )
    exit /b 0
)
"@ | Set-Content -Path "C:\KERJAAN\todolistdesktop\node_modules\7zip-bin\win\x64\7za.cmd" -Encoding ASCII

Write-Output "7za wrapper created"
