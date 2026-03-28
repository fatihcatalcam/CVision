@echo off
echo CVision Sunuculari Baslatiliyor...

echo Backend (FastAPI) baslatiliyor...
start cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload"

echo Frontend (Vite/React) baslatiliyor...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Islem tamam! Sunucularin hazir olmasi birkac saniye surebilir.
echo Lutfen acilan 2 yeni siyah pencereyi (CMD) sunuculari kapatmak isteyene kadar ACIK birakin!
echo Cikmak icin bir tusa basabilirsiniz. Secenekler menusu kapanacaktir fakat sunucular acik kalacaktir.
pause
