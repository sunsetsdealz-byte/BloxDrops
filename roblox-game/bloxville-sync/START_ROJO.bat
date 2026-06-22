@echo off
echo ========================================
echo   BloxVille Rojo Server
echo ========================================
echo.
echo Starting Rojo server...
echo.
echo Keep this window open while working in Studio!
echo.
echo To stop: Press Ctrl+C or close this window
echo.
echo ========================================
echo.

cd /d "%~dp0"
rojo serve

pause
