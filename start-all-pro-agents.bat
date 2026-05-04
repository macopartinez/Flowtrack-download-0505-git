@echo off
echo ========================================
echo   FlowTrack/Waler - Agents Pro
echo ========================================
echo.
echo Demarrage de tous les agents Pro...
echo.

echo [1/3] Agent C - Surveillance basique
start "Agent C" cmd /k python agent_c.py

timeout /t 3 /nobreak >nul

echo [2/3] Agent Pro Clients - Metriques avancees
start "Agent Pro Clients" cmd /k python agent_pro_clients.py

timeout /t 3 /nobreak >nul

echo [3/3] Agent Pro Circle - Cercle/Prospects
start "Agent Pro Circle" cmd /k python agent_pro_circle.py

echo.
echo ========================================
echo   Tous les agents Pro sont demarres!
echo ========================================
echo.
echo Fenetres ouvertes:
echo   - Agent C (surveillance basique)
echo   - Agent Pro Clients (metriques avancees)
echo   - Agent Pro Circle (cercle/prospects)
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
