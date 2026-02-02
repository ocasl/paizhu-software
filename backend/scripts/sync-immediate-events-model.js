/**
 * 同步immediate_events表结构
 */
const { sequelize, ImmediateEvent } = require('../models')

async function sync() {
    try {
        console.log('开始同步immediate_events表...\n')
        
        // 同步模型(不删除已有数据)
        await ImmediateEvent.sync({ alter: true })
        
        console.log('✓ 表结构同步成功!\n')
        
        // 查看表结构
        const [columns] = await sequelize.query(`
            DESCRIBE immediate_events
        `)
        
        console.log('当前表结构:')
        console.table(columns)
        
    } catch (error) {
        console.error('❌ 同步失败:', error.message)
        console.error('详细错误:', error)
    } finally {
        await sequelize.close()
        process.exit(0)
    }
}

sync()
