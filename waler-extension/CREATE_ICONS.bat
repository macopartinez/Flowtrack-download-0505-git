@echo off
echo ========================================
echo    CREATION DES ICONES
echo ========================================
echo.

echo Creation du dossier icons...
if not exist "dist\icons" mkdir "dist\icons"

echo Creation des icones placeholder...

echo ^<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"^>^<rect width="16" height="16" fill="%23667eea"/^>^<text x="8" y="12" font-size="10" fill="white" text-anchor="middle"^>W^</text^>^</svg^> > "dist\icons\icon-16.svg"

echo ^<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"^>^<rect width="32" height="32" fill="%23667eea"/^>^<text x="16" y="22" font-size="20" fill="white" text-anchor="middle"^>W^</text^>^</svg^> > "dist\icons\icon-32.svg"

echo ^<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"^>^<rect width="48" height="48" fill="%23667eea"/^>^<text x="24" y="34" font-size="30" fill="white" text-anchor="middle"^>W^</text^>^</svg^> > "dist\icons\icon-48.svg"

echo ^<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"^>^<rect width="128" height="128" fill="%23667eea"/^>^<text x="64" y="90" font-size="80" fill="white" text-anchor="middle"^>W^</text^>^</svg^> > "dist\icons\icon-128.svg"

echo.
echo Renommage en .png...
ren "dist\icons\icon-16.svg" "icon-16.png"
ren "dist\icons\icon-32.svg" "icon-32.png"
ren "dist\icons\icon-48.svg" "icon-48.png"
ren "dist\icons\icon-128.svg" "icon-128.png"

echo.
echo ✓ Icones creees !
echo.
echo Maintenant, rechargez l'extension dans Chrome
echo.
pause
