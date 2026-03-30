@echo off
REM Energy Charge Daily Summary Scheduler
REM Version: 0.1.5

echo ==========================================
echo   Energy Charge Daily Summary Scheduler
echo   Version: 0.1.5
echo ==========================================

cd /d "%~dp0"

REM Create logs directory
if not exist "logs" mkdir logs

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.7+
    pause
    exit /b 1
)

REM Check dependencies
echo Checking dependencies...
pip install -q pymysql

REM Run mode
if "%1"=="--init" (
    echo Initializing database...
    python init_db.py
) else if "%1"=="--once" (
    echo Running task once...
    python daily_summary.py --once
) else (
    echo Starting scheduler...
    echo Press Ctrl+C to stop
    python daily_summary.py
)

pause
