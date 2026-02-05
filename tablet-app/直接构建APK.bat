@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 直接构建 APK（跳过 Expo Go）
echo ========================================
echo.

cd /d "%~dp0"

echo 💡 重要说明：
echo    - Expo Go 使用新架构，会报 TurboModule 错误
echo    - 独立 APK 使用我们的配置（newArchEnabled=false）
echo    - 所以要直接构建 APK，不要用 Expo Go 测试
echo.

echo 🚀 开始云端构建...
echo.

call npx eas-cli build --platform android --profile production --clear-cache

echo.
echo ========================================
echo ✅ 构建任务已提交！
echo.
echo 📱 查看构建状态:
echo    https://expo.dev
echo.
echo 💡 下一步：
echo    1. 等待 10-20 分钟
echo    2. 下载 APK 文件
echo    3. 直接安装到平板（不要用 Expo Go）
echo ========================================
pause
