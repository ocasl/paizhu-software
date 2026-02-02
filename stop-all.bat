@echo off
chcp 65001 >nul
echo ========================================
echo 停止所有服务
echo ========================================
echo.

echo [1/3] 正在停止后端服务...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq start - backend*" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 后端服务已停止
) else (
    echo ℹ 后端服务未运行
)
echo.

echo [2/3] 正在停止前端服务...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq dev - front*" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 前端服务已停止
) else (
    echo ℹ 前端服务未运行
)
echo.

echo [3/3] 正在停止平板端服务...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq web - tablet-app*" 2>nul
if %errorlevel% equ 0 (
    echo ✓ 平板端服务已停止
) else (
    echo ℹ 平板端服务未运行
)
echo.

echo ========================================
echo ✓ 所有服务已停止！
echo ========================================
echo.
echo 按任意键关闭此窗口...
pause >nul
