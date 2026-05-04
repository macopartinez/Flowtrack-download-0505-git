@echo off
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║     🚀 FLOWTRACK/WALER - Démarrage Complet                   ║
echo ║                                                               ║
echo ║     Frontend React + Backend Express + Agents Python         ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Démarrage du serveur web (React + Express)...
start "FlowTrack Web" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo [2/3] Démarrage de l'Agent A (détection unfollows)...
start "Agent A - Unfollows" cmd /k "python agent_a.py"
timeout /t 2 /nobreak >nul

echo [3/3] Démarrage de l'Agent B (vérification blocked/deleted)...
start "Agent B - Verification" cmd /k "python agent_b.py"

echo.
echo ✅ Tous les services sont démarrés !
echo.
echo 🌐 Application web: http://localhost:5000
echo 📊 Dashboard: Ouvrez votre navigateur
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause >nul
