@echo off
chcp 65001 >nul
echo ========================================
echo   构建环境检查工具
echo ========================================
echo.

set ERROR_COUNT=0

echo [检查 1/8] Node.js...
call node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js %NODE_VERSION%
)

echo.
echo [检查 2/8] npm...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装
    set /a ERROR_COUNT+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm %NPM_VERSION%
)

echo.
echo [检查 3/8] node_modules...
if not exist "node_modules" (
    echo ❌ node_modules 不存在
    echo 💡 运行: npm install
    set /a ERROR_COUNT+=1
) else (
    echo ✅ node_modules 存在
)

echo.
echo [检查 4/8] android 目录...
if not exist "android" (
    echo ❌ android 目录不存在
    echo 💡 运行: npx expo prebuild --platform android
    set /a ERROR_COUNT+=1
) else (
    echo ✅ android 目录存在
)

echo.
echo [检查 5/8] ANDROID_HOME 环境变量...
if not defined ANDROID_HOME (
    echo ❌ ANDROID_HOME 未设置
    echo 💡 需要安装 Android Studio 并配置环境变量
    set /a ERROR_COUNT+=1
) else (
    echo ✅ ANDROID_HOME = %ANDROID_HOME%
    
    REM 检查 SDK 目录是否存在
    if not exist "%ANDROID_HOME%" (
        echo ⚠️  警告: ANDROID_HOME 路径不存在
        set /a ERROR_COUNT+=1
    )
)

echo.
echo [检查 6/8] Java (JDK)...
call java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java 未安装或未配置
    echo 💡 Android 构建需要 JDK 17
    set /a ERROR_COUNT+=1
) else (
    echo ✅ Java 已安装
    java -version 2>&1 | findstr /i "version"
)

echo.
echo [检查 7/8] Gradle...
if exist "android\gradlew.bat" (
    echo ✅ Gradle wrapper 存在
) else (
    echo ❌ Gradle wrapper 不存在
    set /a ERROR_COUNT+=1
)

echo.
echo [检查 8/8] EAS CLI (云端构建)...
call eas --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  EAS CLI 未安装 (云端构建需要)
    echo 💡 运行: npm install -g eas-cli
) else (
    for /f "tokens=*" %%i in ('eas --version') do set EAS_VERSION=%%i
    echo ✅ EAS CLI %EAS_VERSION%
)

echo.
echo ========================================
echo   检查结果
echo ========================================
echo.

if %ERROR_COUNT%==0 (
    echo ✅ 所有检查通过！可以开始构建
    echo.
    echo 💡 推荐构建方式:
    echo    1. 本地构建: fix-and-build.bat 选择 1
    echo    2. 云端构建: fix-and-build.bat 选择 2
) else (
    echo ❌ 发现 %ERROR_COUNT% 个问题
    echo.
    echo 💡 修复建议:
    echo    1. 如果缺少依赖: 运行 npm install
    echo    2. 如果缺少 android: 运行 npx expo prebuild --platform android
    echo    3. 如果要本地构建: 安装 Android Studio
    echo    4. 如果要云端构建: 运行 npm install -g eas-cli
    echo.
    echo 🔧 或者运行: fix-and-build.bat 选择 3 (清理并重新打包)
)

echo ========================================
pause
