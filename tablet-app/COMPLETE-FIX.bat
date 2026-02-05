@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          完整修复并构建 APK                               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 此脚本将完整修复所有问题:
echo   1. 修复 React 版本（19.1.0 → 18.3.1）
echo   2. 修复 Kotlin 版本（1.9.24 → 2.0.21）
echo   3. 清理所有缓存
echo   4. 重新生成项目
echo   5. 云端构建
echo.

set /p confirm="确认执行? (y/n): "
if /i not "%confirm%"=="y" (
    echo 已取消
    pause
    exit /b 0
)

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 1/7: 备份当前配置                           ║
echo ╚════════════════════════════════════════════════════════════╝
copy package.json package.json.before-fix.bak >nul 2>&1
echo ✅ 已备份 package.json

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 2/7: 更新 package.json                      ║
echo ╚════════════════════════════════════════════════════════════╝

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
echo     "expo": "~54.0.0",
echo     "expo-camera": "~17.0.10",
echo     "expo-document-picker": "~14.0.8",
echo     "expo-file-system": "~19.0.21",
echo     "expo-image-picker": "~17.0.10",
echo     "expo-media-library": "~18.2.1",
echo     "expo-sharing": "~14.0.8",
echo     "expo-sqlite": "~16.0.10",
echo     "expo-status-bar": "~3.0.9",
echo     "jszip": "^3.10.1",
echo     "react": "18.3.1",
echo     "react-dom": "18.3.1",
echo     "react-native": "0.76.5",
echo     "react-native-paper": "^5.12.3",
echo     "react-native-safe-area-context": "~5.6.0",
echo     "react-native-screens": "~4.16.0",
echo     "react-native-web": "~0.19.13"
echo   },
echo   "devDependencies": {
echo     "@babel/core": "^7.25.0"
echo   },
echo   "private": true
echo }
) > package.json

echo ✅ package.json 已更新
echo    - React: 19.1.0 → 18.3.1
echo    - React Native: 0.81.5 → 0.76.5

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 3/7: 清理所有文件                           ║
echo ╚════════════════════════════════════════════════════════════╝

if exist "node_modules" (
    echo    清理 node_modules...
    rmdir /s /q "node_modules" 2>nul
)
if exist "android" (
    echo    清理 android...
    rmdir /s /q "android" 2>nul
)
if exist ".expo" (
    echo    清理 .expo...
    rmdir /s /q ".expo" 2>nul
)
if exist "package-lock.json" (
    del "package-lock.json" 2>nul
)

call npm cache clean --force >nul 2>&1

echo ✅ 清理完成

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 4/7: 安装依赖                               ║
echo ╚════════════════════════════════════════════════════════════╝

call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 5/7: 配置 Kotlin 版本                       ║
echo ╚════════════════════════════════════════════════════════════╝

REM 创建 gradle.properties 文件
(
echo # Gradle properties
echo org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
echo org.gradle.parallel=true
echo org.gradle.daemon=true
echo.
echo # Android
echo android.useAndroidX=true
echo android.enableJetifier=true
echo.
echo # Kotlin - 使用 2.0.21 以支持 KSP
echo android.kotlinVersion=2.0.21
) > gradle.properties

echo ✅ 已创建 gradle.properties（Kotlin 2.0.21）

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 6/7: 生成 Android 项目                      ║
echo ╚════════════════════════════════════════════════════════════╝

call npx expo prebuild --platform android --clean
if errorlevel 1 (
    echo ❌ Android 项目生成失败
    pause
    exit /b 1
)

REM 确保 gradle.properties 被复制到 android 目录
if not exist "android\gradle.properties" (
    copy gradle.properties android\gradle.properties >nul
)

echo ✅ Android 项目生成完成

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          步骤 7/7: 云端构建                               ║
echo ╚════════════════════════════════════════════════════════════╝

echo.
echo 📝 修复总结:
echo    ✅ React: 18.3.1
echo    ✅ React Native: 0.76.5
echo    ✅ Expo SDK: 54.0.0
echo    ✅ Kotlin: 2.0.21
echo.

echo 🚀 开始云端构建...
echo.

call eas build --platform android --profile preview

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║          构建完成                                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 💡 如果还是失败:
echo    1. 检查构建日志中的具体错误
echo    2. 确认 Kotlin 版本是否正确应用
echo    3. 可能需要联系 Expo 支持
echo.

pause
