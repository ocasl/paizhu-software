/**
 * 数据库同步脚本
 * 使用 Sequelize 自动创建/更新表结构
 * 
 * 使用方式: npm run db:sync
 */
require('dotenv').config()

const db = require('../models')
const bcrypt = require('bcryptjs')

async function syncDatabase() {
    try {
        console.log('🔄 开始同步数据库...\n')

        // 测试连接
        await db.sequelize.authenticate()
        console.log('✅ 数据库连接成功')
        console.log(`   主机: ${process.env.DB_HOST || 'localhost'}`)
        console.log(`   数据库: ${process.env.DB_NAME || 'paizhu_db'}\n`)

        // 同步所有模型
        // force: true 会删除现有表重新创建（危险！仅开发环境使用）
        // alter: true 会更新表结构但保留数据
        await db.sequelize.sync({ alter: true })
        console.log('✅ 数据库表结构同步完成\n')

        // 检查是否有管理员账号
        const adminCount = await db.User.count({ where: { role: 'admin' } })

        if (adminCount === 0) {
            console.log('📝 未检测到管理员账号，正在创建默认管理员...')

            const hashedPassword = await bcrypt.hash('admin123', 10)

            await db.User.create({
                username: 'admin',
                password: hashedPassword,
                name: '系统管理员',
                prison_name: '女子监狱',
                role: 'admin',
                status: 'active'
            })

            console.log('✅ 默认管理员账号创建成功')
            console.log('   用户名: admin')
            console.log('   密码: admin123')
            console.log('   ⚠️  请登录后立即修改密码!\n')
        } else {
            console.log(`ℹ️  已存在 ${adminCount} 个管理员账号\n`)
        }

        // 显示表信息
        const tables = await db.sequelize.query(
            "SHOW TABLES",
            { type: db.Sequelize.QueryTypes.SHOWTABLES }
        )

        console.log('📊 当前数据库表:')
        for (const table of tables) {
            const [rows] = await db.sequelize.query(`SELECT COUNT(*) as count FROM ${table}`)
            console.log(`   - ${table}: ${rows[0].count} 条记录`)
        }

        console.log('\n✅ 数据库初始化完成!')

    } catch (error) {
        console.error('❌ 数据库同步失败:', error.message)

        if (error.original) {
            console.error('\n详细错误信息:')
            console.error(`   代码: ${error.original.code}`)
            console.error(`   信息: ${error.original.sqlMessage || error.original.message}`)

            if (error.original.code === 'ECONNREFUSED') {
                console.error('\n💡 提示: 请确保 MySQL 服务已启动')
            } else if (error.original.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('\n💡 提示: 请检查 .env 文件中的数据库用户名和密码')
            } else if (error.original.code === 'ER_BAD_DB_ERROR') {
                console.error('\n💡 提示: 数据库不存在，请先创建数据库:')
                console.error('   CREATE DATABASE paizhu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
            }
        }

        process.exit(1)
    } finally {
        await db.sequelize.close()
    }
}

syncDatabase()
