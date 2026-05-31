@echo off
echo ========================================
echo Removing Old Backend Folder
echo ========================================
echo.
echo Closing any open file handles...
echo.

REM Try to remove the backend folder
cd /d "%~dp0"
if exist "backend" (
    echo Attempting to remove backend folder...
    timeout /t 2 /nobreak > /dev/null
    rd /s /q backend
    
    if exist "backend" (
        echo.
        echo [FAILED] Could not remove backend folder.
        echo.
        echo The folder might be:
        echo   1. Open in File Explorer
        echo   2. Open in an IDE/Editor
        echo   3. Terminal is open in that directory
        echo   4. Node.js process is running
        echo.
        echo Please:
        echo   1. Close all File Explorer windows
        echo   2. Close VS Code or any IDE
        echo   3. Close any terminals in backend folder
        echo   4. Run this script again
        echo.
    ) else (
        echo.
        echo [SUCCESS] Backend folder removed!
        echo.
        echo The backend code now exists only in:
        echo   ..\agenticSDLC-backend\
        echo.
    )
) else (
    echo [INFO] Backend folder already removed!
)

echo.
pause
