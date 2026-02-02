@echo off
chcp 65001 >nul
echo ========================================
echo 修复 users 表索引问题
echo ========================================
echo.
echo 此操作将：
echo   1. 删除旧的 users 表
echo   2. 重建 users 表（正确的索引结构）
echo   3. 创建默认管理员账号
echo.
echo ⚠️  警告：所有用户数据将被清空！
echo.
set /p confirm=确认修复？(输入 yes 继续): 

if /i not "%confirm%"=="yes" (
    echo.
    echo 操作已取消
    echo.
    pause
    exit /b
)

echo.
echo 正在修复...
echo.

cd backend
node scripts/fix-users-table.js

cd ..

echo.
echo 按任意键关闭此窗口...
pause >nul
