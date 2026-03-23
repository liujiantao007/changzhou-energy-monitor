@echo off
REM Energy Monitor Docker Stop Script
REM Version: 0.1.5

echo ==========================================
echo   Stopping Energy Monitor Services
echo ==========================================

cd /d "%~dp0"

echo Stopping containers...
docker-compose -f docker-compose.yml down

echo.
echo Services stopped successfully.
echo.
