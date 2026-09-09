Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\user\.gemini\antigravity-ide\brain\b43ef335-da51-4410-b54c-f605e763d414\predictpro_app_icon_1788929844728.jpg'
$destDir = 'c:\Users\user\Downloads\remix_-sofascore-ai (j)\public'

$img = [System.Drawing.Image]::FromFile($src)

# 512x512
$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.DrawImage($img, 0, 0, 512, 512)
$bmp512.Save("$destDir\icon-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save("$destDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512.Save("$destDir\icon-maskable-512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$bmp512.Dispose()

# 192x192
$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.DrawImage($img, 0, 0, 192, 192)
$bmp192.Save("$destDir\icon-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp192.Save("$destDir\icon-maskable-192.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g192.Dispose()
$bmp192.Dispose()

$img.Dispose()
Write-Output "SUCCESS: PNG icons created in $destDir"
