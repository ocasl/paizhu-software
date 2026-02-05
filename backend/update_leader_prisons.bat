@echo off
chcp 65001 >nul
echo ========================================
echo 更新领导账号的监狱权限
echo ========================================

mysql -uroot -proot paizhu_db < "%~dp0update_leader_prisons.sql"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 更新成功！
    echo ========================================
) else (
    echo.
    echo ========================================
    echo 更新失败，请检查错误信息
    echo ========================================
)

pause
