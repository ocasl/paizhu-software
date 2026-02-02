@echo off
chcp 65001 >nul
echo ========================================
echo 一键重启所有服务
echo ========================================
echo.

echo [1/3] 正在重启后端服务...
cd backend
taskkill /F /IM node.exe /FI "WINDOWTITLE eq start - backend*" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 后端服务已停止
) else (
    echo ℹ 后端服务未运行
)
start "start - backend" cmd /k "npm run dev"
echo ✓ 后端服务已启动
cd ..
echo.

timeout /t 2 /nobreak >nul

echo [2/3] 正在重启前端服务...
cd front
taskkill /F /IM node.exe /FI "WINDOWTITLE eq dev - front*" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 前端服务已停止
) else (
    echo ℹ 前端服务未运行
)
start "dev - front" cmd /k "npm run dev"
echo ✓ 前端服务已启动
cd ..
echo.

timeout /t 2 /nobreak >nul

echo [3/3] 正在重启平板端服务...
cd tablet-app
taskkill /F /IM node.exe /FI "WINDOWTITLE eq web - tablet-app*" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 平板端服务已停止
) else (
    echo ℹ 平板端服务未运行
)
start "web - tablet-app" cmd /k "npm run web"
echo ✓ 平板端服务已启动
cd ..
echo.

echo ========================================
echo ✓ 所有服务已重启完成！
echo ========================================
echo.
echo 服务地址：
echo   后端: http://localhost:3000
echo   前端: http://localhost:5173
echo   平板: http://localhost:19006
echo.
echo 按任意键关闭此窗口...
pause >nul
