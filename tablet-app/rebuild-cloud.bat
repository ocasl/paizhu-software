@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 重新提交云端构建
echo ========================================
echo.

cd /d "%~dp0"

echo 🧹 清理旧的构建缓存...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
if exist .expo rmdir /s /q .expo

echo.
echo 📦 开始云端构建...
echo.
echo 💡 已修复的问题：
echo    ✅ enableBundleCompression 已删除
echo    ✅ newArchEnabled 已关闭（避免 TurboModule 错误）
echo    ✅ Kotlin 2.0.21 已配置
echo.
echo ⏱️  构建需要 10-20 分钟
echo.

call npx eas-cli build --platform android --profile production --clear-cache

echo.
echo ========================================
echo ✅ 构建任务已提交！
echo.
echo 📱 查看构建状态:
echo    https://expo.dev
echo.
echo 💡 提示:
echo    - 构建完成后会收到邮件通知
echo    - 可以直接下载 APK
echo ========================================
pause
