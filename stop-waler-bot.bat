@echo off
echo Stopping Waler Bot...
curl -X POST http://localhost:5000/api/admin/waler-bot/stop
echo.
echo Waler bot stopped!
pause
