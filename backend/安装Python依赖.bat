@echo off
chcp 65001 >nul
echo ========================================
echo 安装 Python 依赖包
echo ========================================
echo.

cd utils

echo 检查 Python 版本...
python --version
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3
    pause
    exit /b 1
)

echo.
echo 安装依赖包...
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [错误] 安装失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✓ 安装成功！
echo ========================================
echo.
echo 测试解析器...
python parse_criminal_report.py "../../muban/XX省XX监狱2025年某月犯情动态.docx"

echo.
pause
