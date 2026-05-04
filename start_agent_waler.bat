@echo off
REM Script de lancement de l'Agent Waler
REM Agrégateur et synchroniseur de données

echo ========================================
echo   Agent Waler - Demarrage
echo ========================================
echo.

REM Vérifier que le fichier .env existe
if not exist .env (
    echo ERREUR: Fichier .env introuvable
    echo Copiez .env.example vers .env et configurez vos variables
    pause
    exit /b 1
)

REM Activer l'environnement virtuel si il existe
if exist venv\Scripts\activate.bat (
    echo Activation de l'environnement virtuel...
    call venv\Scripts\activate.bat
) else (
    echo ATTENTION: Environnement virtuel non trouve
    echo Utilisation de Python global
)

echo.
echo Lancement de l'Agent Waler...
echo Cycle d'agregation: toutes les 15 minutes
echo Appuyez sur Ctrl+C pour arreter
echo.

python agent_waler.py

pause
