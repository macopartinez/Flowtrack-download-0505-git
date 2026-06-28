@echo off
echo ========================================
echo    FIX WALER EXTENSION
echo ========================================
echo.

echo Nettoyage...
if exist dist rmdir /s /q dist
if exist node_modules rmdir /s /q node_modules
echo ✓ Nettoyage termine
echo.

echo Installation des dependances...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation echouee
    pause
    exit /b 1
)
echo ✓ Dependances installees
echo.

echo Build de l'extension...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Build echoue
    echo.
    echo Verifiez les erreurs TypeScript ci-dessus
    pause
    exit /b 1
)
echo ✓ Build termine
echo.

echo Verification des fichiers...
if not exist "dist\manifest.json" (
    echo ERREUR: manifest.json manquant
    pause
    exit /b 1
)
if not exist "dist\background" (
    echo ERREUR: dossier background manquant
    pause
    exit /b 1
)
if not exist "dist\content" (
    echo ERREUR: dossier content manquant
    pause
    exit /b 1
)
echo ✓ Tous les fichiers presents
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
