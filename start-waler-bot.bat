@echo off
echo ========================================
echo Starting Waler Bot...
echo ========================================
echo.
powershell -Command "Invoke-WebRequest -Uri http://localhost:5000/api/admin/waler-bot/start -Method POST"
echo.
echo ========================================
echo Chrome will open - Login manually with:
echo Username: waler.web
echo Password: Instawebsite1er2026
echo ========================================
pause
