@echo off
chcp 65001 >nul
echo ================================================================================
echo 为Excel数据表添加 upload_month 字段
echo ================================================================================
echo.

cd /d "%~dp0"

echo 正在执行SQL脚本...
mysql -u root -p < add_upload_month_to_excel_tables.sql

if %errorlevel% equ 0 (
    echo.
    echo ✅ 数据库字段添加成功！
    echo.
    echo 已添加字段到以下表：
    echo   - strict_educations ^(严管教育^)
    echo   - confinements ^(禁闭审批^)
    echo   - blacklists ^(涉黑恶名单^)
    echo   - restraint_usages ^(戒具使用^)
    echo   - mail_records ^(信件汇总^)
    echo.
    echo 现在可以重新上传Excel文件测试了！
) else (
    echo.
    echo ❌ 执行失败，请检查MySQL连接
)

echo.
pause
