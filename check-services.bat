@echo off
echo ========================================
echo AgenticSDLC - Service Status Checker
echo ========================================
echo.

REM Colors using ANSI escape codes
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%[1/4] Checking PostgreSQL Database...%NC%
netstat -ano | findstr ":5432" > nul
if %errorlevel% equ 0 (
    echo     %GREEN%[RUNNING]%NC% PostgreSQL is listening on port 5432
    set DB_STATUS=RUNNING
) else (
    echo     %RED%[STOPPED]%NC% PostgreSQL is not running
    set DB_STATUS=STOPPED
)

echo.
echo %BLUE%[2/4] Checking Backend API Server...%NC%
netstat -ano | findstr ":3001" > nul
if %errorlevel% equ 0 (
    echo     %GREEN%[RUNNING]%NC% Backend is listening on port 3001
    set BACKEND_STATUS=RUNNING

    REM Test health endpoint
    curl -s http://localhost:3001/health > nul 2>&1
    if %errorlevel% equ 0 (
        echo     %GREEN%[HEALTHY]%NC% Health endpoint responds
    ) else (
        echo     %YELLOW%[WARNING]%NC% Port open but health check failed
    )
) else (
    echo     %RED%[STOPPED]%NC% Backend is not running
    set BACKEND_STATUS=STOPPED
)

echo.
echo %BLUE%[3/4] Checking Frontend Dev Server...%NC%
netstat -ano | findstr ":5173" > nul
if %errorlevel% equ 0 (
    echo     %GREEN%[RUNNING]%NC% Frontend is listening on port 5173
    set FRONTEND_STATUS=RUNNING
) else (
    echo     %RED%[STOPPED]%NC% Frontend is not running
    set FRONTEND_STATUS=STOPPED
)

echo.
echo %BLUE%[4/4] Testing Database Connection...%NC%
cd backend
node test-db-simple.cjs > nul 2>&1
if %errorlevel% equ 0 (
    echo     %GREEN%[CONNECTED]%NC% Database connection successful
) else (
    echo     %RED%[FAILED]%NC% Cannot connect to database
)
cd ..

echo.
echo ========================================
echo Summary
echo ========================================
echo PostgreSQL:  %DB_STATUS%
echo Backend:     %BACKEND_STATUS%
echo Frontend:    %FRONTEND_STATUS%
echo.

REM Overall status
if "%DB_STATUS%"=="RUNNING" if "%BACKEND_STATUS%"=="RUNNING" if "%FRONTEND_STATUS%"=="RUNNING" (
    echo %GREEN%[ALL SERVICES RUNNING]%NC%
    echo.
    echo You can access the application at:
    echo   Frontend: http://localhost:5173
    echo   Backend:  http://localhost:3001
    echo   Health:   http://localhost:3001/health
) else (
    echo %RED%[SOME SERVICES NOT RUNNING]%NC%
    echo.
    echo To start missing services:
    if "%DB_STATUS%"=="STOPPED" echo   - PostgreSQL: net start postgresql*
    if "%BACKEND_STATUS%"=="STOPPED" echo   - Backend: cd backend ^&^& npm run dev
    if "%FRONTEND_STATUS%"=="STOPPED" echo   - Frontend: npm run dev
)

echo.
echo ========================================
pause
