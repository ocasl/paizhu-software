@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 最终修复并构建 APK
echo ========================================
echo.

cd /d "%~dp0"

echo 📋 当前修复状态：
echo    ✅ enableBundleCompression 已删除
echo    ✅ newArchEnabled = false （关闭新架构）
echo    ✅ Kotlin 2.0.21 已配置
echo    ✅ React 18.3.1 + RN 0.76.5
echo.

echo 🧹 步骤 1/4: 清理所有缓存...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo    ✅ 缓存已清理
echo.

echo 🔄 步骤 2/4: 清理 npm 缓存...
call npm cache clean --force
echo    ✅ npm 缓存已清理
echo.

echo 📦 步骤 3/4: 重新安装依赖...
call npm install
echo    ✅ 依赖已安装
echo.

echo 🚀 步骤 4/4: 提交云端构建...
echo.
echo 💡 提示：
echo    - 这次会上传最新的配置（newArchEnabled=false）
echo    - 构建需要 10-20 分钟
echo    - 完成后会收到邮件通知
echo.
pause
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
echo    1. 等待构建完成（10-20分钟）
echo    2. 收到邮件通知后下载 APK
echo    3. 安装到平板测试
echo ========================================
pause
