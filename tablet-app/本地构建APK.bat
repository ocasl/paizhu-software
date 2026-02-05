@echo off
chcp 65001 >nul
echo ========================================
echo 🏗️ 本地构建 APK
echo ========================================
echo.

cd /d "%~dp0"

echo ⚠️  前置要求：
echo    1. 已安装 Android Studio
echo    2. 已配置 ANDROID_HOME 环境变量
echo    3. 路径示例：C:\Users\你的用户名\AppData\Local\Android\Sdk
echo.

echo 📋 检查 ANDROID_HOME...
if not defined ANDROID_HOME (
    echo ❌ 错误：ANDROID_HOME 未设置！
    echo.
    echo 💡 设置方法：
    echo    1. 右键"此电脑" - 属性 - 高级系统设置
    echo    2. 环境变量 - 新建系统变量
    echo    3. 变量名：ANDROID_HOME
    echo    4. 变量值：C:\Users\你的用户名\AppData\Local\Android\Sdk
    echo    5. 重启命令行窗口
    echo.
    pause
    exit /b 1
)

echo ✅ ANDROID_HOME = %ANDROID_HOME%
echo.

echo 🧹 清理旧的构建...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
echo.

echo 📦 开始本地构建...
echo    ⏱️  首次构建需要 20-30 分钟（下载依赖）
echo    ⏱️  后续构建只需 5-10 分钟
echo.

call npx expo run:android --variant release

echo.
echo ========================================
if exist android\app\build\outputs\apk\release\app-release.apk (
    echo ✅ 构建成功！
    echo.
    echo 📱 APK 位置：
    echo    android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo 💡 下一步：
    echo    1. 复制 APK 到平板
    echo    2. 安装测试
) else (
    echo ❌ 构建失败，请查看上面的错误信息
)
echo ========================================
pause
