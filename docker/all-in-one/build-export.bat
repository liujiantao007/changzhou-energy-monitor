@echo off
REM Energy Monitor Docker Image Build and Export Script
REM For Windows 11 - Build and export for offline deployment
REM Version: 0.1.5

setlocal EnableDelayedExpansion

echo ==========================================
echo   Energy Monitor Docker Image Builder
echo   Version: 0.1.5
echo   Platform: Windows 11
echo ==========================================

cd /d "%~dp0"

REM Configuration
set IMAGE_NAME=energy-monitor
set IMAGE_TAG=0.1.5
set OUTPUT_FILE=energy-monitor-0.1.5.tar.gz

REM Check Docker
echo.
echo [1/5] Checking Docker environment...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop for Windows.
    pause
    exit /b 1
)
echo Docker is available.

REM Check .env file
echo.
echo [2/5] Checking configuration...
if not exist ".env" (
    echo Warning: .env file not found, creating from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo Created .env file. Please edit it before deployment.
    )
)

REM Build Docker image
echo.
echo [3/5] Building Docker image...
echo Image: %IMAGE_NAME%:%IMAGE_TAG%
docker build -t %IMAGE_NAME%:%IMAGE_TAG% -f Dockerfile ..\..\

if errorlevel 1 (
    echo ERROR: Failed to build Docker image!
    pause
    exit /b 1
)

echo Image built successfully.

REM Verify image
echo.
echo [4/5] Verifying image...
docker images %IMAGE_NAME%:%IMAGE_TAG%

REM Export image
echo.
echo [5/5] Exporting image to file...
echo Output: %OUTPUT_FILE%

docker save %IMAGE_NAME%:%IMAGE_TAG% | gzip > %OUTPUT_FILE%

if errorlevel 1 (
    echo ERROR: Failed to export image!
    pause
    exit /b 1
)

REM Calculate checksum
echo.
echo Calculating MD5 checksum...
certutil -hashfile %OUTPUT_FILE% MD5

echo.
echo ==========================================
echo   Build and Export Complete!
echo ==========================================
echo.
echo Output file: %OUTPUT_FILE%
echo.
echo Next steps:
echo   1. Copy %OUTPUT_FILE% to Ubuntu server
echo   2. Copy deploy-ubuntu.sh to Ubuntu server
echo   3. Run: chmod +x deploy-ubuntu.sh ^&^& ./deploy-ubuntu.sh
echo.
echo File location: %CD%\%OUTPUT_FILE%
echo.

REM Open folder
explorer .

pause
endlocal
