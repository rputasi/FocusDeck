Add-Type -AssemblyName System.Drawing
$path = "C:\KERJAAN\todolistdesktop\public\icon.png"
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "HighQuality"
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(0,0)),
  (New-Object System.Drawing.Point(256,256)),
  [System.Drawing.Color]::FromArgb(124,58,237),
  [System.Drawing.Color]::FromArgb(99,102,241)
)
$g.FillRectangle($brush, 0, 0, 256, 256)
$font = New-Object System.Drawing.Font("Segoe UI", 100, [System.Drawing.FontStyle]::Bold)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = "Center"
$fmt.LineAlignment = "Center"
$g.DrawString([char]0x26A1, $font, [System.Drawing.Brushes]::White, 128, 128, $fmt)
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "Icon created at $path"
