@echo off
chcp 65001 >nul
echo ========================================
echo 创建演示用户
echo ========================================
echo.
echo 将创建以下用户:
echo.
echo 1. 系统管理员 (admin)
echo 2. 院领导 (yuanlingdao) - 可查看所有监狱
echo 3. 分管领导1 (lingdao1) - 分管女子监狱、男子监狱
echo 4. 分管领导2 (lingdao2) - 分管未成年犯管教所、豫章监狱
echo 5. 女子监狱检察员1 (nvzi_jcy1)
echo 6. 女子监狱检察员2 (nvzi_jcy2)
echo 7. 男子监狱检察员1 (nanzi_jcy1)
echo 8. 男子监狱检察员2 (nanzi_jcy2)
echo 9. 未成年犯管教所检察员 (wcn_jcy)
echo 10. 豫章监狱检察员 (yuzhang_jcy)
echo.
echo 默认密码: 123456
echo.
echo ========================================
pause
echo.
node scripts/create-demo-users.js
pause
