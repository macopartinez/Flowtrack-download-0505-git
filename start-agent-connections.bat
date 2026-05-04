@echo off
echo ========================================
echo   Agent Connections - Waler
echo   Analyse de la qualite relationnelle
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] Verification de l'environnement...
if not exist ".env" (
    echo ERREUR: Fichier .env manquant
    pause
    exit /b 1
)

echo [2/2] Demarrage de l'Agent Connections...
echo.
echo Planification: 3h00 du matin (quotidien)
echo Appuyez sur Ctrl+C pour arreter
echo.

python agent_connections.py

pause
