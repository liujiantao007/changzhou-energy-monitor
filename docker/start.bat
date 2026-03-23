@echo off
REM Energy Monitor Docker Deployment Script
REM Version: 0.1.5

setlocal EnableDelayedExpansion

echo ==========================================
echo   Energy Monitor Docker Deployment
echo   Version: 0.1.5
echo ==========================================

cd /d "%~dp0"

REM Check if .env file exists
if not exist ".env" (
    echo Warning: .env file not found, creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Created .env file. Please edit it with your configuration.
    ) else (
        echo Error: .env.example not found!
        exit /b 1
    )
)

REM Build images
echo.
echo [1/4] Building Docker images...
docker-compose -f docker-compose.yml build --no-cache
if errorlevel 1 (
    echo Error: Failed to build Docker images
    exit /b 1
)

REM Stop existing containers
echo.
echo [2/4] Stopping existing containers...
docker-compose -f docker-compose.yml down --remove-orphans

REM Start containers
echo.
echo [3/4] Starting containers...
docker-compose -f docker-compose.yml up -d
if errorlevel 1 (
    echo Error: Failed to start containers
    exit /b 1
)

REM Wait for services
echo.
echo [4/4] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Show status
echo.
echo Checking service health...
docker-compose -f docker-compose.yml ps

echo.
echo ==========================================
echo   Deployment Complete!
echo ==========================================
echo.
echo Services:
echo   - Frontend: http://localhost
echo   - Backend API: http://localhost:5000
echo   - Health Check: http://localhost/api/health
echo.
echo Useful commands:
echo   - View logs: docker-compose -f docker-compose.yml logs -f
echo   - Stop services: stop.bat
echo   - Health check: health-check.bat
echo.

endlocal
