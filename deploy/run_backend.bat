@echo off
REM CVision Backend Startup Script
REM This file is run by the Windows Service (NSSM)

cd ..\backend

REM Activate Virtual Environment
call .\cv_env_313\Scripts\activate.bat

REM Check for .env.production, use it if exists
IF EXIST ".env.production" (
    echo Using Production Environment
    copy /Y .env.production .env
) ELSE (
    echo Using Default Environment
)

REM Run Database Migrations (Optional but recommended)
REM alembic upgrade head

REM Start FastAPI with Uvicorn
uvicorn app.main:app --host 127.0.0.1 --port 8001
