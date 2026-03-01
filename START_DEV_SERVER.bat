@echo off
REM Kill existing Node processes
echo Killing old Node processes...
taskkill /F /IM node.exe /T 2>nul || echo No running node processes

REM Small delay to ensure processes are killed
timeout /t 2 /nobreak

REM Start dev server
echo.
echo Starting development server...
echo.
cd /d "c:\Users\rames\OneDrive\Desktop\Mistral hackathon"
npm run dev

pause
