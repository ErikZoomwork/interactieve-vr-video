@echo off
echo ============================================
echo   Interactieve VR Video - Server Starten
echo ============================================
echo.

:: Check of Python beschikbaar is
where python >nul 2>nul
if %errorlevel%==0 (
    echo Server starten op http://localhost:8080
    echo.
    echo Open dit adres op je Meta Quest 3:
    echo.
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
        set ip=%%a
        echo   http://%%a:8080
    )
    echo.
    echo Druk Ctrl+C om te stoppen.
    echo.
    python -m http.server 8080
) else (
    echo Python niet gevonden!
    echo.
    echo Installeer Python van https://python.org
    echo Of gebruik: npx http-server -p 8080 --cors
    echo.
    pause
)
