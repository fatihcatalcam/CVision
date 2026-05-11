@echo off
echo CVision Backend - Localhost Modu
echo Port: http://127.0.0.1:8001
echo API Docs: http://127.0.0.1:8001/docs
echo.

cd /d "%~dp0backend"

if not exist "%~dp0backend\cv_env_local\Scripts\python.exe" (
    echo Sanal ortam olusturuluyor...
    "C:\Users\fthct\AppData\Local\Programs\Python\Python312\python.exe" -m venv "%~dp0backend\cv_env_local"
)

echo Bagimliliklar kontrol ediliyor...
"%~dp0backend\cv_env_local\Scripts\python.exe" -m pip install -r "%~dp0backend\requirements.local.txt" -q

echo Veritabani guncelleniyor...
"%~dp0backend\cv_env_local\Scripts\python.exe" migrate_local.py
if errorlevel 1 (
    echo HATA: Veritabani guncellenemedi!
    pause
    exit /b 1
)

echo.
echo Sunucu baslatiliyor...
"%~dp0backend\cv_env_local\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
