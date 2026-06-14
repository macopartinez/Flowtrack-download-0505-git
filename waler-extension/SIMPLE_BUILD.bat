@echo off
echo ========================================
echo    SIMPLE BUILD (TypeScript only)
echo ========================================
echo.

echo Nettoyage...
if exist dist-simple rmdir /s /q dist-simple
mkdir dist-simple
mkdir dist-simple\background
mkdir dist-simple\content  
mkdir dist-simple\popup
echo.

echo Compilation TypeScript vers JavaScript...
call npx tsc --outDir dist-simple --module es2020 --target es2020 --moduleResolution node
if %errorlevel% neq 0 (
    echo ERREUR: Compilation echouee
    pause
    exit /b 1
)
echo.

echo Copie du HTML...
copy src\popup\index.html dist-simple\popup\index.html
echo.

echo Creation du manifest...
(
echo {
echo   "manifest_version": 3,
echo   "name": "Waler - Instagram Analytics",
echo   "version": "1.0.0",
echo   "description": "Track your Instagram followers, unfollowers, and engagement in real-time",
echo   "permissions": ["storage", "alarms", "notifications"],
echo   "host_permissions": ["https://www.instagram.com/*", "https://i.instagram.com/*"],
echo   "background": {
echo     "service_worker": "background/service-worker.js",
echo     "type": "module"
echo   },
echo   "content_scripts": [{
echo     "matches": ["https://www.instagram.com/*"],
echo     "js": ["content/instagram-tracker.js"],
echo     "run_at": "document_idle"
echo   }],
echo   "action": {
echo     "default_popup": "popup/index.html"
echo   }
echo }
) > dist-simple\manifest.json
echo.

echo ========================================
echo    BUILD TERMINE !
echo ========================================
echo.
echo Dossier: %cd%\dist-simple
echo.
echo CHARGER DANS CHROME:
echo 1. Aller sur chrome://extensions/
echo 2. Activer "Mode developpeur"
echo 3. Cliquer "Charger l'extension non empaquetee"
echo 4. Selectionner: %cd%\dist-simple
echo.
pause
