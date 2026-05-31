@echo off
echo ========================================
echo GitHub Integration Setup
echo ========================================
echo.
echo This script will help you configure GitHub integration.
echo.
echo You will need:
echo   1. GitHub Personal Access Token
echo   2. Token scopes: repo, workflow
echo.
echo If you don't have a token, create one at:
echo https://github.com/settings/tokens
echo.
pause

echo.
echo Detected repository: Abhay-Kumar-NTT/agenticsdlc-agents
echo.

set /p GITHUB_TOKEN="Enter your GitHub Personal Access Token: "

if "%GITHUB_TOKEN%"=="" (
    echo.
    echo [ERROR] Token cannot be empty!
    pause
    exit /b 1
)

echo.
echo Creating .env file...

(
echo # API Configuration
echo VITE_API_BASE_URL=http://localhost:3001
echo.
echo # GitHub Configuration
echo VITE_GITHUB_TOKEN=%GITHUB_TOKEN%
echo VITE_GITHUB_OWNER=Abhay-Kumar-NTT
echo VITE_GITHUB_REPO=agenticsdlc-agents
) > .env

echo.
echo [SUCCESS] .env file created!
echo.
echo Configuration:
echo   Owner: Abhay-Kumar-NTT
echo   Repo:  agenticsdlc-agents
echo   Token: %GITHUB_TOKEN:~0,8%... (hidden)
echo.
echo IMPORTANT: Restart your frontend server for changes to take effect!
echo.
echo To restart:
echo   1. Press Ctrl+C in frontend terminal
echo   2. Run: npm run dev
echo.
pause
