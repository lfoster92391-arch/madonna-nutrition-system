Add-Type -AssemblyName System.Drawing

$root = "C:\Users\LisaMorris\madonna-nutrition-management-system"
$logoPath = Join-Path $root "public\logo.png"
$crestPath = Join-Path $root "public\crest.png"
$watermarkPath = Join-Path $root "public\watermark.png"

function Save-Crop {
  param(
    [string]$SourcePath,
    [string]$DestPath,
    [int]$X,
    [int]$Y,
    [int]$Width,
    [int]$Height
  )
  $source = [System.Drawing.Image]::FromFile($SourcePath)
  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $srcRect = New-Object System.Drawing.Rectangle $X, $Y, $Width, $Height
  $graphics.DrawImage($source, 0, 0, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  $bitmap.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $source.Dispose()
  $bitmap.Dispose()
}

$logo = [System.Drawing.Image]::FromFile($logoPath)
Write-Output "logo: $($logo.Width)x$($logo.Height)"

# Crest: left emblem only (knight + shield + DONS banner)
$crestW = [Math]::Min(300, [int]($logo.Width * 0.29))
$crestH = $logo.Height
$logo.Dispose()
Save-Crop -SourcePath $logoPath -DestPath $crestPath -X 0 -Y 0 -Width $crestW -Height $crestH
Write-Output "created crest.png ($crestW x $crestH)"

# Watermark: faint crest from logo right edge, or scaled crest fallback
$logo = [System.Drawing.Image]::FromFile($logoPath)
$wmX = [Math]::Max(0, $logo.Width - 320)
$wmW = [Math]::Min(320, $logo.Width - $wmX)
$wmH = $logo.Height
Save-Crop -SourcePath $logoPath -DestPath $watermarkPath -X $wmX -Y 0 -Width $wmW -Height $wmH
$logo.Dispose()
Write-Output "created watermark.png ($wmW x $wmH)"

Get-ChildItem (Join-Path $root "public\*.png") | ForEach-Object { "$($_.Name) $($_.Length)" }
