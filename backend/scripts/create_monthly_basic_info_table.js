/**
 * 创建 monthly_basic_info 表的脚本
 */
require('dotenv').config()
const { sequelize } = require('../models')
const fs = require('fs')
const path = require('path')

async function createTable() {
    try {
        console.log('正在连接数据库...')
        await sequelize.authenticate()
        console.log('✅ 数据库连接成功')
        
        // 检查表是否存在
        const [results] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = '${process.env.DB_NAME}' 
            AND table_name = 'monthly_basic_info'
        `)
        
        if (results[0].count > 0) {
            console.log('✅ monthly_basic_info 表已存在')
            process.exit(0)
        }
        
        console.log('📝 monthly_basic_info 表不存在，正在创建...')
        
        // 读取SQL文件
        const sqlFile = path.join(__dirname, '../migrations/create_monthly_basic_info.sql')
        const sql = fs.readFileSync(sqlFile, 'utf8')
        
        // 执行SQL
        await sequelize.query(sql)
        
        console.log('✅ monthly_basic_info 表创建成功！')
        
        // 验证表结构
        const [columns] = await sequelize.query(`
            SHOW COLUMNS FROM monthly_basic_info
        `)
        
        console.log(`\n表结构 (${columns.length} 个字段):`)
        columns.forEach(col => {
            console.log(`  - ${col.Field} (${col.Type})`)
        })
        
        process.exit(0)
    } catch (error) {
        console.error('❌ 创建表失败:', error)
        process.exit(1)
    }
}

createTable()
