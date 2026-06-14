@echo off
echo ========================================
echo    BUILD MANUEL WALER EXTENSION
echo ========================================
echo.

echo Nettoyage du dossier dist...
if exist dist rmdir /s /q dist
echo ✓ Dossier nettoye
echo.

echo Build TypeScript...
call npx tsc
if %errorlevel% neq 0 (
    echo ERREUR: Compilation TypeScript echouee
    pause
    exit /b 1
)
echo ✓ TypeScript compile dans dist/
echo.

echo Copie du HTML popup...
copy src\popup\index.html dist\popup\index.html
echo ✓ HTML copie
echo.

echo Creation du manifest.json pour production...
powershell -Command "$manifest = Get-Content manifest.json | ConvertFrom-Json; $manifest.background.service_worker = 'background/service-worker.js'; $manifest.content_scripts[0].js = @('content/instagram-tracker.js'); $manifest.action.default_popup = 'popup/index.html'; $manifest | ConvertTo-Json -Depth 10 | Set-Content dist\manifest.json"
echo ✓ Manifest cree
echo.

echo ========================================
echo    EXTENSION PRETE !
echo ========================================
echo.
echo Dossier: %cd%\dist
echo.
echo CHARGER DANS CHROME:
echo 1. Aller sur chrome://extensions/
echo 2. Activer "Mode developpeur"
echo 3. Cliquer "Charger l'extension non empaquetee"
echo 4. Selectionner: %cd%\dist
echo.
pause
