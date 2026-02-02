@echo off
chcp 65001 >nul
echo ========================================
echo 清空所有测试数据
echo ========================================
echo.
echo ⚠️  警告：此操作将清空以下数据：
echo   - 所有日检察记录
echo   - 所有周检察记录
echo   - 所有月检察记录
echo   - 所有及时检察记录
echo   - 所有附件记录
echo   - 所有归档记录
echo   - 所有附件文件
echo.
echo 此操作不可恢复！
echo.
set /p confirm=确认清空所有数据？(输入 yes 继续): 

if /i not "%confirm%"=="yes" (
    echo.
    echo 操作已取消
    echo.
    pause
    exit /b
)

echo.
echo 正在清空数据...
echo.

cd backend
node scripts/clear-all-data.js

cd ..

echo.
echo 按任意键关闭此窗口...
pause >nul
