# Script pour ajouter .js aux imports relatifs pour compatibilité ES6 modules

$files = Get-ChildItem -Path "src" -Filter "*.ts" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Ajouter .js aux imports relatifs qui n'en ont pas déjà
    # Pattern: from './xxx' ou from "../xxx" sans .js à la fin
    $content = $content -replace "from\s+['""](\.\./[^'""]+?)['""]\s*;", "from '`$1.js';"
    $content = $content -replace "from\s+['""](\./[^'""]+?)['""]\s*;", "from '`$1.js';"
    
    # Enlever les doubles .js.js si créés par erreur
    $content = $content -replace "\.js\.js", ".js"
    
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Fixed: $($file.Name)"
}

Write-Host ""
Write-Host "All imports fixed!"
