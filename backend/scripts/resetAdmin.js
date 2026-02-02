/**
 * 重置管理员密码脚本
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('../models')

async function resetAdminPassword() {
    try {
        await db.sequelize.authenticate()
        console.log('数据库连接成功')

        // 查找管理员
        let admin = await db.User.findOne({ where: { username: 'admin' } })

        const hashedPassword = await bcrypt.hash('admin123', 10)

        if (admin) {
            // 更新密码
            await admin.update({ password: hashedPassword })
            console.log('✅ 管理员密码已重置')
        } else {
            // 创建新管理员
            admin = await db.User.create({
                username: 'admin',
                password: hashedPassword,
                name: '系统管理员',
                prison_name: '女子监狱',
                role: 'admin',
                status: 'active'
            })
            console.log('✅ 管理员账号已创建')
        }

        console.log('用户名: admin')
        console.log('密码: admin123')

    } catch (error) {
        console.error('错误:', error.message)
    } finally {
        await db.sequelize.close()
    }
}

resetAdminPassword()
