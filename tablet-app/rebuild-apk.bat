@echo off
chcp 65001 >nul
echo ========================================
echo   一键修复并重新构建 APK
echo ========================================
echo.

echo 此脚本将:
echo   1. 降级到稳定的 Expo SDK 51
echo   2. 清理所有缓存和依赖
echo   3. 重新安装依赖
echo   4. 使用云端构建 APK
echo.

set /p confirm="确认执行? (y/n): "
if /i not "%confirm%"=="y" (
    echo 已取消
    pause
    exit /b 0
)

echo.
echo ========================================
echo [1/6] 备份当前配置...
echo ========================================
copy package.json package.json.backup >nul
echo ✅ 已备份 package.json

echo.
echo ========================================
echo [2/6] 切换到 SDK 51...
echo ========================================

REM 创建 SDK 51 的 package.json
(
echo {
echo   "name": "tablet-app",
echo   "version": "1.0.0",
echo   "main": "index.js",
echo   "scripts": {
echo     "start": "expo start",
echo     "android": "expo run:android",
echo     "ios": "expo run:ios",
echo     "web": "expo start --web"
echo   },
echo   "dependencies": {
echo     "@react-navigation/bottom-tabs": "^6.5.20",
echo     "@react-navigation/native": "^6.1.17",
echo     "@react-navigation/native-stack": "^6.9.26",
echo     "expo": "~51.0.0",
echo     "expo-camera": "~15.0.14",
echo     "expo-document-picker": "~12.0.2",
echo     "expo-file-system": "~17.0.1",
echo     "expo-image-picker": "~15.0.7",
echo     "expo-media-library": "~16.0.4",
echo     "expo-sharing": "~12.0.1",
echo     "expo-sqlite": "~14.0.6",
echo     "expo-status-bar": "~1.12.1",
echo     "jszip": "^3.10.1",
echo     "react": "18.2.0",
echo     "react-dom": "18.2.0",
echo     "react-native": "0.74.5",
echo     "react-native-paper": "^5.12.3",
echo     "react-native-safe-area-context": "4.10.5",
echo     "react-native-screens": "3.31.1",
echo     "react-native-web": "~0.19.10"
echo   },
echo   "devDependencies": {
echo     "@babel/core": "^7.20.0"
echo   },
echo   "private": true
echo }
) > package.json

echo ✅ 已切换到 SDK 51

echo.
echo ========================================
echo [3/6] 清理缓存和依赖...
echo ========================================

if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo ✅ 已清理 node_modules
)

if exist "package-lock.json" (
    del package-lock.json
    echo ✅ 已清理 package-lock.json
)

if exist "android" (
    rmdir /s /q "android"
    echo ✅ 已清理 android
)

if exist ".expo" (
    rmdir /s /q ".expo"
    echo ✅ 已清理 .expo
)

call npm cache clean --force
echo ✅ 已清理 npm 缓存

echo.
echo ========================================
echo [4/6] 安装依赖...
echo ========================================

call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    echo.
    echo 💡 尝试手动运行: npm install
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

echo.
echo ========================================
echo [5/6] 生成 Android 项目...
echo ========================================

call npx expo prebuild --platform android --clean
if errorlevel 1 (
    echo ❌ Android 项目生成失败
    pause
    exit /b 1
)

echo ✅ Android 项目生成完成

echo.
echo ========================================
echo [6/6] 开始云端构建...
echo ========================================

echo 选择构建类型:
echo   1. preview (预览版，推荐)
echo   2. production (生产版)
echo.
set /p build_type="请选择 (1 或 2): "

if "%build_type%"=="1" (
    set PROFILE=preview
) else if "%build_type%"=="2" (
    set PROFILE=production
) else (
    echo ❌ 无效选择，使用默认 preview
    set PROFILE=preview
)

echo.
echo 🚀 开始构建 %PROFILE% 版本...
call eas build --platform android --profile %PROFILE%

echo.
echo ========================================
echo ✅ 构建任务已提交！
echo.
echo 📱 查看构建进度:
echo    https://expo.dev
echo.
echo 💡 提示:
echo    - 如果还是失败，查看构建日志
echo    - 可能需要等待 10-20 分钟
echo    - 完成后会收到邮件通知
echo ========================================
pause
