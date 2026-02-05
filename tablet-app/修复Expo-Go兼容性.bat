@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 修复 Expo Go 兼容性
echo ========================================
echo.

cd /d "%~dp0"

echo 📋 修复内容：
echo    ✅ React 19.1.0 （匹配 Expo SDK 54）
echo    ✅ React Native 0.81.5 （匹配 Expo SDK 54）
echo    ✅ newArchEnabled = true （Expo Go 需要）
echo    ✅ Kotlin 2.0.21
echo.

echo 🧹 步骤 1/4: 清理缓存...
if exist node_modules rmdir /s /q node_modules
if exist .expo rmdir /s /q .expo
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
echo    ✅ 缓存已清理
echo.

echo 📦 步骤 2/4: 安装正确版本的依赖...
call npm install
echo    ✅ 依赖已安装
echo.

echo 🔄 步骤 3/4: 预构建原生模块...
call npx expo prebuild --clean
echo    ✅ 预构建完成
echo.

echo 🚀 步骤 4/4: 启动开发服务器...
echo.
echo 💡 提示：
echo    - 现在可以用 Expo Go 扫码了
echo    - 如果还有错误，按 Ctrl+C 停止，然后运行：
echo      npx expo start --clear
echo.
pause
echo.

call npx expo start --clear

pause
