$src = "C:\KERJAAN\todolistdesktop\release\win-unpacked"
$dest = "$env:LOCALAPPDATA\FocusDesk"
$desktop = [Environment]::GetFolderPath("Desktop")

Write-Host "Copying app to $dest..."
if (Test-Path $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
Copy-Item -LiteralPath $src -Destination $dest -Recurse -Force

$exePath = "$dest\FocusDesk.exe"
$shortcutPath = "$desktop\FocusDesk.lnk"

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $exePath
$shortcut.WorkingDirectory = $dest
$shortcut.Description = "FocusDesk - Productivity OS for ADHD brains"
$shortcut.Save()

Write-Host "Done! Desktop shortcut created at: $shortcutPath"
Write-Host "App installed to: $dest"
