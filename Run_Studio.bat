@echo off
chcp 65001 > nul
title Etsy Design QC Studio - Dakuho

echo ============================================================
echo   Etsy Design QC Studio - Dakuho QC System
echo ============================================================
echo.
echo Starting local web app server...
echo Web app will automatically open at: http://localhost:3000/
echo.

start "" "http://localhost:3000/"

call npm run dev

pause
