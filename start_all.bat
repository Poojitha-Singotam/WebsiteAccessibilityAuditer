@echo off
echo ========================================================
echo STARTING FULL STACK WEB ACCESSIBILITY AUDITOR
echo ========================================================

:: Check if mysqld is running on port 3307
netstat -ano | findstr :3307 >nul
if %errorlevel% neq 0 (
    echo [INFO] Starting MySQL Server on port 3307...
    start "MySQL Daemon (3307)" cmd /k "mysqld.exe --port=3307 --datadir=\"C:\Users\Poojitha\smart job & internship macther\mysql_data\" --console"
    timeout /t 3 /nobreak >nul
)

echo Starting Flask Backend Server on port 5050...
start "A11y Auditor Backend (Flask)" cmd /k "%~dp0start_backend.bat"

timeout /t 2 /nobreak >nul
echo Opening Web Accessibility Auditor in your default browser...
start http://127.0.0.1:5050/

echo ========================================================
echo Applications launched!
echo URL: http://127.0.0.1:5050/
echo ========================================================
