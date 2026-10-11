@echo off
REM One-time setup for Windows: creates a Python virtual environment, installs all dependencies.
echo === CryptoSentinel setup ===
where python >nul 2>nul || (echo [ERROR] Python 3.10+ not found. Install from https://www.python.org/downloads/ and tick "Add to PATH". & exit /b 1)
where node >nul 2>nul || (echo [ERROR] Node.js 18+ not found. Install from https://nodejs.org/ & exit /b 1)

if not exist .venv (
  echo [1/4] Creating Python virtual environment...
  python -m venv .venv || exit /b 1
)
echo [2/4] Installing backend packages...
call .venv\Scripts\python.exe -m pip install --upgrade pip >nul
call .venv\Scripts\python.exe -m pip install -r requirements.txt || exit /b 1

echo [3/4] Installing frontend packages...
pushd frontend
call npm install || (popd & exit /b 1)
popd

if not exist .env (
  echo [4/4] Creating .env from template...
  copy .env.example .env >nul
  echo.
  echo   ACTION NEEDED: open .env and paste your ETHERSCAN_API_KEY ^(and optionally TRONGRID_API_KEY^).
) else (
  echo [4/4] .env already exists - leaving it unchanged.
)
echo.
echo Setup complete. Start the app with:  start.bat
