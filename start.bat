@echo off
REM Starts backend (port 8001) and frontend (port 5174) in two windows. Run setup.bat first.
if not exist .venv (echo Run setup.bat first. & exit /b 1)
if not exist .env (echo Missing .env - run setup.bat first. & exit /b 1)

echo Starting backend on http://localhost:8001 ...
start "CryptoSentinel Backend" cmd /k ".venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8001"
timeout /t 3 /nobreak >nul

echo Starting frontend on http://localhost:5174 ...
start "CryptoSentinel Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo  App:        http://localhost:5174
echo  API docs:   http://localhost:8001/docs
