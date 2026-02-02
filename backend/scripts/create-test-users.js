/**
 * 创建测试用户脚本
 * 用于测试新的权限系统
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('../models')

async function createTestUsers() {
    try {
        await db.sequelize.authenticate()
        console.log('✅ 数据库连接成功')

        const password = await bcrypt.hash('123456', 10)

        // 1. 创建派驻检察官（女子监狱）
        const officer1 = await db.User.findOrCreate({
            where: { username: 'officer1' },
            defaults: {
                username: 'officer1',
                password: password,
                name: '张检察官',
                prison_name: '女子监狱',
                role: 'inspector',
                status: 'active'
            }
        })
        console.log('✅ 创建派驻检察官（女子监狱）:', officer1[0].name)

        // 2. 创建派驻检察官（第一监狱）
        const officer2 = await db.User.findOrCreate({
            where: { username: 'officer2' },
            defaults: {
                username: 'officer2',
                password: password,
                name: '李检察官',
                prison_name: '第一监狱',
                role: 'inspector',
                status: 'active'
            }
        })
        console.log('✅ 创建派驻检察官（第一监狱）:', officer2[0].name)

        // 3. 创建业务分管领导
        const leader = await db.User.findOrCreate({
            where: { username: 'leader1' },
            defaults: {
                username: 'leader1',
                password: password,
                name: '王分管领导',
                prison_name: null, // 分管领导不绑定单一监狱
                role: 'leader',
                status: 'active'
            }
        })
        console.log('✅ 创建业务分管领导:', leader[0].name)

        // 为分管领导分配监狱范围
        if (db.UserPrisonScope) {
            await db.UserPrisonScope.findOrCreate({
                where: { user_id: leader[0].id, prison_name: '女子监狱' }
            })
            await db.UserPrisonScope.findOrCreate({
                where: { user_id: leader[0].id, prison_name: '第一监狱' }
            })
            console.log('✅ 为分管领导分配监狱范围: 女子监狱, 第一监狱')
        }

        // 4. 创建院领导
        const topViewer = await db.User.findOrCreate({
            where: { username: 'yuanlingdao' },
            defaults: {
                username: 'yuanlingdao',
                password: password,
                name: '赵院领导',
                prison_name: null,
                role: 'top_viewer',
                status: 'active'
            }
        })
        console.log('✅ 创建院领导:', topViewer[0].name)

        console.log('\n========================================')
        console.log('测试账号创建完成！')
        console.log('========================================')
        console.log('派驻检察官1: officer1 / 123456 (女子监狱)')
        console.log('派驻检察官2: officer2 / 123456 (第一监狱)')
        console.log('业务分管领导: leader1 / 123456 (分管: 女子监狱, 第一监狱)')
        console.log('院领导: yuanlingdao / 123456 (查看所有)')
        console.log('========================================')

        process.exit(0)
    } catch (error) {
        console.error('❌ 创建失败:', error)
        process.exit(1)
    }
}

createTestUsers()
