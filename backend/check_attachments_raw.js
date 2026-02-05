/**
 * 直接查询数据库检查附件
 */
const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

async function checkAttachmentsRaw() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'paizhu_db'
    })
    
    try {
        console.log('='.repeat(80))
        console.log('直接查询数据库检查附件表')
        console.log('='.repeat(80))
        
        // 查询表结构
        const [columns] = await connection.query('DESCRIBE attachments')
        console.log('\n📋 attachments 表结构:')
        columns.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`)
        })
        
        // 查询所有附件
        const [rows] = await connection.query(`
            SELECT 
                id, 
                user_id, 
                category, 
                original_name, 
                file_name, 
                upload_month,
                created_at,
                updated_at
            FROM attachments 
            ORDER BY id DESC 
            LIMIT 20
        `)
        
        console.log(`\n📊 最近20条附件记录:\n`)
        rows.forEach(row => {
            console.log(`ID: ${row.id}`)
            console.log(`  原始名: ${row.original_name}`)
            console.log(`  文件名: ${row.file_name}`)
            console.log(`  分类: ${row.category}`)
            console.log(`  归档月份: ${row.upload_month}`)
            console.log(`  用户ID: ${row.user_id}`)
            console.log(`  创建时间: ${row.created_at}`)
            console.log(`  更新时间: ${row.updated_at}`)
            console.log('')
        })
        
        // 统计今天的附件
        const [todayCount] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM attachments 
            WHERE DATE(created_at) = '2026-02-05'
        `)
        console.log(`📅 2026-02-05 的附件数量: ${todayCount[0].count}`)
        
        // 统计文件名以 20260205 开头的附件
        const [fileNameCount] = await connection.query(`
            SELECT COUNT(*) as count 
            FROM attachments 
            WHERE file_name LIKE '20260205_%'
        `)
        console.log(`📁 文件名以 20260205_ 开头的附件数量: ${fileNameCount[0].count}`)
        
        console.log('\n' + '='.repeat(80))
        
    } catch (error) {
        console.error('查询失败:', error)
    } finally {
        await connection.end()
    }
}

checkAttachmentsRaw()
