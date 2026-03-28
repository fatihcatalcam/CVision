@echo off
REM CVision NSSM Service Installer
echo CVision Backend Windows Service Installer using NSSM (Non-Sucking Service Manager)
echo Please ensure you are running this as Administrator and have downloaded 'nssm.exe'

REM Assuming nssm.exe is in the current directory or system PATH
WHERE nssm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] nssm is not found in PATH!
    echo Please download NSSM from http://nssm.cc/ and place nssm.exe in this folder.
    pause
    exit /b 1
)

set SERVICE_NAME=CVisionBackend
set START_SCRIPT=%~dp0run_backend.bat

echo Installing service: %SERVICE_NAME%
nssm install %SERVICE_NAME% "%START_SCRIPT%"

echo Configuring service to start automatically...
nssm set %SERVICE_NAME% AppDirectory "%~dp0"
nssm set %SERVICE_NAME% AppStdout "%~dp0backend_output.log"
nssm set %SERVICE_NAME% AppStderr "%~dp0backend_error.log"

echo Starting the service...
nssm start %SERVICE_NAME%

echo.
echo Setup Complete! The backend is now running as a service.
echo You can check its status using "services.msc" under the name '%SERVICE_NAME%'.
pause
