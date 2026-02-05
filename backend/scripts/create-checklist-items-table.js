/**
 * 创建清单项目表
 */
const { sequelize } = require('../models')

async function createTable() {
  try {
    console.log('开始创建 report_checklist_items 表...')
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS report_checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prison_name VARCHAR(100) NOT NULL COMMENT '监狱名称',
        year INT NOT NULL COMMENT '年份',
        month INT NOT NULL COMMENT '月份',
        item_id INT NOT NULL COMMENT '清单项目ID (1-16)',
        content TEXT COMMENT '报告内容',
        situation TEXT COMMENT '检察情况',
        check_time VARCHAR(50) COMMENT '记录时间',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_checklist_item (prison_name, year, month, item_id),
        INDEX idx_prison_date (prison_name, year, month)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报告清单项目表';
    `)
    
    console.log('✓ report_checklist_items 表创建成功')
    process.exit(0)
  } catch (error) {
    console.error('创建表失败:', error)
    process.exit(1)
  }
}

createTable()
