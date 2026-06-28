@echo off
echo ========================================
echo TEST - Detection des Nouveaux Followers
echo ========================================
echo.
echo Ce script va rebuilder l'extension et vous guider dans les tests
echo.

echo [1/3] Rebuilding extension...
call BUILD.bat
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: Build failed
    pause
    exit /b 1
)

echo.
echo [2/3] Extension rebuilt successfully!
echo.
echo [3/3] Instructions de test:
echo.
echo 1. Rechargez l'extension dans Chrome:
echo    - Allez sur chrome://extensions/
echo    - Cliquez sur le bouton "Recharger" de Waler
echo.
echo 2. Ouvrez Instagram:
echo    - Allez sur https://www.instagram.com/VOTRE_USERNAME
echo    - Ouvrez la console (F12)
echo.
echo 3. Demandez a quelqu'un de vous follow
echo    - Ou utilisez un compte test
echo.
echo 4. Observez les logs dans la console:
echo    - Vous devriez voir: "[API] Follower count changed"
echo    - Puis: "Received FOLLOWER_COUNT_CHANGED"
echo    - Puis: "Synchronized lastFollowerCount"
echo.
echo 5. Verifiez la notification Windows
echo    - Une notification devrait apparaitre
echo    - Le badge devrait afficher +1
echo.
echo 6. Attendez 30 secondes
echo    - Le systeme DOM devrait verifier
echo    - Vous devriez voir: "[DOM] Checking: current=X, last=X, diff=0"
echo    - Pas de double detection = SUCCESS!
echo.
echo ========================================
echo LOGS A SURVEILLER (dans la console)
echo ========================================
echo.
echo BON FONCTIONNEMENT:
echo   [API] Follower count changed: 213 -^> 214 (+1)
echo   Updated lastFollowerCount to 214
echo   Received FOLLOWER_COUNT_CHANGED
echo   Synchronized lastFollowerCount to 214
echo   [DOM] Checking: current=214, last=214, diff=0
echo.
echo PROBLEME:
echo   [DOM] Checking: current=214, last=213, diff=1
echo   ^(L'API n'a pas detecte le changement^)
echo.
echo ========================================
echo.
pause
