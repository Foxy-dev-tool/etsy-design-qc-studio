@echo off
chcp 65001 > nul
title Hệ Thống Quản Lý Đơn Hàng Etsy - Dakuho QC Studio

echo ============================================================
echo   Etsy Design QC Studio - Enterprise Order Management
echo   Operator: Dakuho
echo ============================================================
echo.
echo [1/2] Đang kiểm tra môi trường và khởi chạy ứng dụng...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Node.js chưa được cài đặt trên máy tính.
    echo Vui lòng cài đặt Node.js từ https://nodejs.org/ rồi thử lại.
    pause
    exit /b
)

if not exist node_modules (
    echo [thông báo] Đang cài đặt thư viện cần thiết (chỉ chạy lần đầu)...
    call npm install
)

echo.
echo [2/2] Đang khởi động máy chủ Local Dev Server...
echo ➜ Ứng dụng sẽ tự động mở trình duyệt tại: http://localhost:3000/
echo.

start "" "http://localhost:3000/"

call npm run dev

pause
