# Script pour convertir webextension-polyfill vers Chrome API native

$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Remplacer l'import
    $content = $content -replace "import browser from 'webextension-polyfill';", "// Using Chrome API"
    
    # Remplacer toutes les occurrences de 'browser.' par 'chrome.'
    $content = $content -replace '\bbrowser\.', 'chrome.'
    
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Converted: $($file.Name)"
}

Write-Host ""
Write-Host "Conversion complete!"
