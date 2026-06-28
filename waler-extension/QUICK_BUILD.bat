@echo off
echo ========================================
echo    QUICK BUILD (Sans bundler)
echo ========================================
echo.

echo Nettoyage...
if exist dist rmdir /s /q dist
mkdir dist
mkdir dist\background
mkdir dist\content  
mkdir dist\popup
echo.

echo Copie des fichiers TypeScript compiles...
xcopy /Y src\background\*.ts dist\background\
xcopy /Y src\content\*.ts dist\content\
xcopy /Y src\popup\*.ts dist\popup\
xcopy /Y src\types\*.ts dist\types\ 2>nul
xcopy /Y src\utils\*.ts dist\utils\ 2>nul
echo.

echo Copie du HTML...
copy src\popup\index.html dist\popup\index.html
echo.

echo Creation du manifest simplifie...
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
) > dist\manifest.json
echo.

echo ATTENTION: Cette version necessite un bundler
echo Utilisez BUILD.bat avec esbuild pour une version complete
echo.
pause
