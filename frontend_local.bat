@echo off
echo CVision Frontend - Localhost Modu
echo Adres: http://localhost:5173
echo.
cd /d %~dp0frontend
npm run dev -- --host localhost
pause
