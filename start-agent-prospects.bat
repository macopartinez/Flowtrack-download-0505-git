@echo off
echo ========================================
echo   Agent Prospects - Waler
echo   Detection des nouveaux followers
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Verification de l'environnement...
if not exist ".env" (
    echo ERREUR: Fichier .env manquant
    pause
    exit /b 1
)

echo [2/2] Demarrage de l'Agent Prospects...
echo.
echo Planification: 6h, 12h, 18h, 00h
echo Appuyez sur Ctrl+C pour arreter
echo.

python agent_prospects.py

pause
