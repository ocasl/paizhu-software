@echo off
chcp 65001 >nul
echo ========================================
echo 启动后端服务
echo ========================================
echo.

cd backend
echo 正在启动后端服务...
node app.js

pause
