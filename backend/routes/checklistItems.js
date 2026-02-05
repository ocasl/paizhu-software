const express = require('express')
const router = express.Router()
const { ReportChecklistItem, sequelize } = require('../models')
const { authenticateToken } = require('../middleware/auth')

// 确保表存在
let tableChecked = false
async function ensureTable() {
  if (tableChecked) return
  
  try {
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
    tableChecked = true
    console.log('✓ report_checklist_items 表已就绪')
  } catch (error) {
    console.error('创建 report_checklist_items 表失败:', error.message)
  }
}

// 获取清单项目（按监狱和月份）
router.get('/', authenticateToken, async (req, res) => {
  try {
    await ensureTable() // 确保表存在
    
    const { prison_name, year, month } = req.query
    
    if (!prison_name || !year || !month) {
      return res.status(400).json({ message: '缺少必要参数' })
    }
    
    const items = await ReportChecklistItem.findAll({
      where: {
        prison_name,
        year: parseInt(year),
        month: parseInt(month)
      },
      attributes: ['id', 'prison_name', 'year', 'month', 'item_id', 'content', 'situation', 'check_time'],
      order: [['item_id', 'ASC']]
    })
    
    res.json({ data: items })
  } catch (error) {
    console.error('获取清单项目失败:', error)
    res.status(500).json({ message: '获取清单项目失败', error: error.message })
  }
})

// 保存/更新清单项目
router.post('/', authenticateToken, async (req, res) => {
  try {
    await ensureTable() // 确保表存在
    
    const { prison_name, year, month, item_id, content, situation, check_time } = req.body
    
    if (!prison_name || !year || !month || !item_id) {
      return res.status(400).json({ message: '缺少必要参数' })
    }
    
    // 使用原始 SQL 进行 upsert（兼容性更好）
    await sequelize.query(`
      INSERT INTO report_checklist_items 
        (prison_name, year, month, item_id, content, situation, check_time, createdAt, updatedAt)
      VALUES 
        (:prison_name, :year, :month, :item_id, :content, :situation, :check_time, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        content = VALUES(content),
        situation = VALUES(situation),
        check_time = VALUES(check_time),
        updatedAt = NOW()
    `, {
      replacements: {
        prison_name,
        year: parseInt(year),
        month: parseInt(month),
        item_id: parseInt(item_id),
        content: content || '',
        situation: situation || '',
        check_time: check_time || ''
      }
    })
    
    res.json({ 
      message: '保存成功'
    })
  } catch (error) {
    console.error('保存清单项目失败:', error)
    res.status(500).json({ message: '保存清单项目失败', error: error.message })
  }
})

// 批量保存清单项目
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    await ensureTable() // 确保表存在
    
    const { prison_name, year, month, items } = req.body
    
    if (!prison_name || !year || !month || !Array.isArray(items)) {
      return res.status(400).json({ message: '缺少必要参数' })
    }
    
    for (const item of items) {
      await sequelize.query(`
        INSERT INTO report_checklist_items 
          (prison_name, year, month, item_id, content, situation, check_time, createdAt, updatedAt)
        VALUES 
          (:prison_name, :year, :month, :item_id, :content, :situation, :check_time, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          content = VALUES(content),
          situation = VALUES(situation),
          check_time = VALUES(check_time),
          updatedAt = NOW()
      `, {
        replacements: {
          prison_name,
          year: parseInt(year),
          month: parseInt(month),
          item_id: parseInt(item.item_id),
          content: item.content || '',
          situation: item.situation || '',
          check_time: item.check_time || ''
        }
      })
    }
    
    res.json({ 
      message: '批量保存成功'
    })
  } catch (error) {
    console.error('批量保存清单项目失败:', error)
    res.status(500).json({ message: '批量保存清单项目失败', error: error.message })
  }
})

module.exports = router
