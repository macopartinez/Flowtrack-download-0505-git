@echo off
echo ========================================
echo Starting Agent B (Account Verifier)...
echo ========================================
echo.
powershell -Command "Invoke-WebRequest -Uri http://localhost:5000/api/admin/agent-b/start -Method POST"
echo.
echo ========================================
echo Chrome will open - Login manually with:
echo Username: nathan_winters8th
echo Password: Neverlesssayless2026
echo ========================================
pause
