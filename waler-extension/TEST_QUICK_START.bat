@echo off
echo ========================================
echo    WALER EXTENSION - QUICK TEST
echo ========================================
echo.

echo [1/4] Installation des dependances...
call npm install
if %errorlevel% neq 0 (
    echo ERREUR: Installation echouee
    pause
    exit /b 1
)
echo ✓ Dependances installees
echo.

echo [2/4] Build de l'extension...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Build echoue
    pause
    exit /b 1
)
echo ✓ Extension buildee dans dist/
echo.

echo [3/4] Verification du build...
if not exist "dist\manifest.json" (
    echo ERREUR: manifest.json manquant
    pause
    exit /b 1
)
if not exist "dist\background.js" (
    echo ERREUR: background.js manquant
    pause
    exit /b 1
)
if not exist "dist\content.js" (
    echo ERREUR: content.js manquant
    pause
    exit /b 1
)
echo ✓ Tous les fichiers presents
echo.

echo [4/4] Ouverture de Chrome Extensions...
start chrome://extensions/
echo.

echo ========================================
echo    BUILD TERMINE !
echo ========================================
echo.
echo PROCHAINES ETAPES:
echo.
echo 1. Dans Chrome, activer "Mode developpeur"
echo 2. Cliquer "Charger l'extension non empaquetee"
echo 3. Selectionner le dossier: %cd%\dist
echo 4. L'extension apparait dans la liste
echo 5. Epingler l'extension (icone puzzle)
echo.
echo Ensuite:
echo - Aller sur instagram.com
echo - Se connecter
echo - Cliquer sur l'icone Waler
echo - Tester la collecte de DMs
echo.
echo Documentation complete: EXTENSION_TESTING_GUIDE.md
echo.
pause
