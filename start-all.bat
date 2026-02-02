@echo off
chcp 65001 >nul
echo ========================================
echo 启动所有服务
echo ========================================
echo.

echo [1/3] 正在启动后端服务...
cd backend
start "start - backend" cmd /k "npm run dev"
echo ✓ 后端服务已启动
cd ..
echo.

timeout /t 2 /nobreak >nul

echo [2/3] 正在启动前端服务...
cd front
start "dev - front" cmd /k "npm run dev"
echo ✓ 前端服务已启动
cd ..
echo.

timeout /t 2 /nobreak >nul

echo [3/3] 正在启动平板端服务...
cd tablet-app
start "web - tablet-app" cmd /k "npm run web"
echo ✓ 平板端服务已启动
cd ..
echo.

echo ========================================
echo ✓ 所有服务已启动完成！
echo ========================================
echo.
echo 服务地址：
echo   后端: http://localhost:3000
echo   前端: http://localhost:5173
echo   平板: http://localhost:19006
echo.
echo 按任意键关闭此窗口...
pause >nul
