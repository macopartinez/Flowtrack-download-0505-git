@echo off
echo ========================================
echo Starting Agent C (Pro Tracker)...
echo ========================================
echo.
powershell -Command "Invoke-WebRequest -Uri http://localhost:5000/api/admin/agent-c/start -Method POST"
echo.
echo ========================================
echo Chrome will open - Login manually with:
echo Username: Nathan.return
echo Password: Gottacheck2026
echo ========================================
pause
