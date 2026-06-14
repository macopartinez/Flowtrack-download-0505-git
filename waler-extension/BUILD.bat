@echo off
echo ========================================
echo    BUILD WALER EXTENSION
echo ========================================
echo.

echo Installation d'esbuild si necessaire...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation echouee
    pause
    exit /b 1
)
echo.

echo Build de l'extension...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Build echoue
    pause
    exit /b 1
)
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
echo OU si deja chargee:
echo - Cliquer sur le bouton Recharger (icone circulaire)
echo.
pause
