@echo off
REM Energy Monitor Docker Restart Script
REM Version: 0.1.5

echo ==========================================
echo   Restarting Energy Monitor Services
echo ==========================================

cd /d "%~dp0"

echo Restarting containers...
docker-compose -f docker-compose.yml restart

echo.
echo Services restarted successfully.
echo.

docker-compose -f docker-compose.yml ps
