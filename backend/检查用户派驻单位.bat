@echo off
chcp 65001 >nul
echo 检查用户派驻单位配置...
echo.
node scripts/check-user-prison-name.js
pause
