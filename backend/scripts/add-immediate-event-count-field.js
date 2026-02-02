/**
 * 添加及时检察事件统计字段到月度归档表
 */
const { sequelize } = require('../models')

async function migrate() {
    try {
        console.log('开始执行迁移...')
        
        // 检查字段是否已存在
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'monthly_archives' 
            AND COLUMN_NAME = 'immediate_event_count'
        `)
        
        if (results.length > 0) {
            console.log('✓ 字段 immediate_event_count 已存在，无需添加')
            return
        }
        
        // 添加字段
        await sequelize.query(`
            ALTER TABLE monthly_archives 
            ADD COLUMN immediate_event_count INT DEFAULT 0 COMMENT '及时检察事件数量'
        `)
        
        console.log('✓ 成功添加字段 immediate_event_count')
        
    } catch (error) {
        console.error('✗ 迁移失败:', error.message)
        throw error
    } finally {
        await sequelize.close()
    }
}

migrate()
    .then(() => {
        console.log('\n迁移完成！')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n迁移失败:', error)
        process.exit(1)
    })
