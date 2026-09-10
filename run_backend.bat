@echo off
title Clean Water Initiative — Backend (FastAPI)
echo ========================================================
echo  Starting Clean Water Initiative Backend API (FastAPI)
echo ========================================================
cd /d "%~dp0backend"

:: Try running via uv (recommended, zero-install virtual env)
where uv >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Detected 'uv' package manager. Launching FastAPI server...
    uv run --with fastapi --with uvicorn --with pydantic --with pydantic-settings --with sqlalchemy --with aiosqlite --with python-multipart --with pillow uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    goto end
)

:: Fallback to system Python / virtualenv
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Detected system Python. Launching FastAPI server...
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    goto end
)

echo [ERROR] Neither 'uv' nor 'python' was found in your PATH.
echo Please install Python 3.11+ or uv (https://astral.sh/uv).
pause

:end
