/**
 * 为Excel数据表添加prison_name字段的迁移脚本
 * 使用Node.js执行，无需手动配置MySQL路径
 */

require('dotenv').config()
const { sequelize } = require('../models')
const fs = require('fs')
const path = require('path')

async function runMigration() {
    console.log('========================================')
    console.log('Excel数据表添加派驻单位字段迁移')
    console.log('========================================\n')

    try {
        console.log('数据库配置:')
        console.log(`  数据库名: ${process.env.DB_NAME || 'paizhu_db'}`)
        console.log(`  用户名: ${process.env.DB_USER || 'root'}`)
        console.log(`  主机: ${process.env.DB_HOST || 'localhost'}`)
        console.log()

        console.log('警告：此操作将修改数据库表结构！')
        console.log('将为以下5个表添加prison_name字段：')
        console.log('  1. strict_educations (严管教育)')
        console.log('  2. confinements (禁闭审批)')
        console.log('  3. blacklists (涉黑恶名单)')
        console.log('  4. restraint_usages (戒具使用)')
        console.log('  5. mail_records (信件汇总)')
        console.log()

        // 测试数据库连接
        console.log('正在连接数据库...')
        await sequelize.authenticate()
        console.log('✓ 数据库连接成功\n')

        // 读取SQL文件
        const sqlFile = path.join(__dirname, '../migrations/add-prison-name-to-excel-tables.sql')
        if (!fs.existsSync(sqlFile)) {
            throw new Error('SQL迁移文件不存在: ' + sqlFile)
        }

        const sqlContent = fs.readFileSync(sqlFile, 'utf8')
        
        // 分割SQL语句（按分号分割，忽略注释）
        const statements = sqlContent
            .split('\n')
            .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
            .join('\n')
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)

        console.log(`共有 ${statements.length} 条SQL语句需要执行\n`)
        console.log('开始执行迁移...\n')

        let successCount = 0
        let skipCount = 0
        let errorCount = 0

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i]
            const preview = stmt.substring(0, 60).replace(/\s+/g, ' ')
            
            try {
                await sequelize.query(stmt)
                console.log(`✓ [${i + 1}/${statements.length}] ${preview}...`)
                successCount++
            } catch (error) {
                // 检查是否是"字段已存在"或"索引已存在"的错误
                if (error.message.includes('Duplicate column name') || 
                    error.message.includes('Duplicate key name') ||
                    error.message.includes("Can't DROP")) {
                    console.log(`⊙ [${i + 1}/${statements.length}] ${preview}... (已存在，跳过)`)
                    skipCount++
                } else {
                    console.error(`✗ [${i + 1}/${statements.length}] ${preview}...`)
                    console.error(`  错误: ${error.message}`)
                    errorCount++
                }
            }
        }

        console.log('\n========================================')
        if (errorCount === 0) {
            console.log('迁移成功完成！')
            console.log('========================================\n')
            console.log(`执行结果：`)
            console.log(`  ✓ 成功: ${successCount} 条`)
            if (skipCount > 0) {
                console.log(`  ⊙ 跳过: ${skipCount} 条 (已存在)`)
            }
            console.log()
            console.log('接下来需要：')
            console.log('1. 确保所有用户都有prison_name字段')
            console.log('   运行: node scripts/check-user-prison-name.js')
            console.log()
            console.log('2. 测试数据隔离功能')
            console.log('   运行: node scripts/test-data-isolation.js')
            console.log()
            console.log('3. 重新上传Excel文件（旧数据需要手动更新prison_name）')
            console.log()
        } else {
            console.log('迁移失败！')
            console.log('========================================\n')
            console.log(`执行结果：`)
            console.log(`  ✓ 成功: ${successCount} 条`)
            if (skipCount > 0) {
                console.log(`  ⊙ 跳过: ${skipCount} 条`)
            }
            console.log(`  ✗ 失败: ${errorCount} 条`)
            console.log()
            console.log('请检查错误信息并手动修复')
        }

    } catch (error) {
        console.error('\n迁移失败:', error.message)
        console.error('\n可能的原因：')
        console.error('1. 数据库连接失败（检查.env配置）')
        console.error('2. 权限不足')
        console.error('3. SQL语法错误')
        process.exit(1)
    } finally {
        await sequelize.close()
    }
}

// 运行迁移
runMigration()
