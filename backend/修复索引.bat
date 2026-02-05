@echo off
chcp 65001 >nul
cd /d %~dp0
echo ========================================
echo 修复 monthly_basic_info 表索引
echo ========================================
echo.
echo 当前目录: %CD%
echo.
echo 这将删除旧的 unique_user_month 索引
echo 并创建新的 unique_prison_month 索引
echo.
pause
echo.
mysql -u root -p paizhu_db < "%~dp0migrations\fix_monthly_basic_info_index.sql"
echo.
echo ========================================
echo 修复完成！请重启后端服务。
echo ========================================
pause
