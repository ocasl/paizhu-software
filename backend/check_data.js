require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'paizhu_db'
  })

  console.log('=== 检查 monthly_basic_info 表数据 ===\n')
  
  const [rows] = await connection.query('SELECT id, prison_name, report_month, total_prisoners FROM monthly_basic_info ORDER BY id DESC LIMIT 10')
  
  console.log('最近10条记录:')
  console.table(rows)
  
  console.log('\n=== 按监狱分组统计 ===\n')
  const [stats] = await connection.query(`
    SELECT prison_name, report_month, COUNT(*) as count 
    FROM monthly_basic_info 
    GROUP BY prison_name, report_month 
    ORDER BY report_month DESC, prison_name
  `)
  console.table(stats)
  
  await connection.end()
}

checkData().catch(console.error)
