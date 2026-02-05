@echo off
chcp 65001 >nul
echo ================================================================================
echo 一键修复 Excel 数据表 upload_month 字段问题
echo ================================================================================
echo.

cd /d "%~dp0"

echo [步骤 1/4] 检查数据库字段是否存在...
echo.
node check_upload_month_field.js
echo.

echo [步骤 2/4] 添加数据库字段...
echo.
echo 请输入MySQL root密码：
mysql -u root -p < add_upload_month.sql
echo.

if %errorlevel% neq 0 (
    echo ❌ 数据库字段添加失败
    echo 请检查MySQL连接或手动执行: mysql -u root -p ^< add_upload_month.sql
    pause
    exit /b 1
)

echo ✅ 数据库字段添加成功
echo.

echo [步骤 3/4] 再次检查字段...
echo.
node check_upload_month_field.js
echo.

echo [步骤 4/4] 清空旧测试数据（可选）...
echo.
choice /C YN /M "是否清空旧的Excel测试数据"
if errorlevel 2 goto skip_clear
if errorlevel 1 goto do_clear

:do_clear
node clear_excel_data.js
echo.
goto finish

:skip_clear
echo 跳过清空数据
echo.

:finish
echo ================================================================================
echo 修复完成！
echo ================================================================================
echo.
echo 接下来的步骤：
echo 1. 重启服务: cd .. ^&^& restart-all.bat
echo 2. 登录系统（派驻检察官账号）
echo 3. 选择"数据归属月份"（如：2026-02）
echo 4. 重新上传Excel文件测试
echo 5. 运行验证: node backend\check_data_2026_02.js
echo.
echo 详细说明请查看: backend\修复upload_month问题.md
echo.
pause
