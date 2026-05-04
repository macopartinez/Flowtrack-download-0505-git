@echo off
echo ========================================
echo Starting Agent A (Unfollow Detector)...
echo ========================================
echo.
powershell -Command "Invoke-WebRequest -Uri http://localhost:5000/api/admin/agent-a/start -Method POST"
echo.
echo ========================================
echo Chrome will open - Login manually with:
echo Username: clara_argentinabuen
echo Password: Instagrame20220
echo ========================================
pause
