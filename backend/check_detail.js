require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkDetail() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'paizhu_db'
  })

  console.log('=== 检查 monthly_basic_info 详细数据 ===\n')
  
  const [rows] = await connection.query(`
    SELECT id, prison_name, report_month, total_prisoners, major_criminals, 
           updated_at 
    FROM monthly_basic_info 
    ORDER BY updated_at DESC
  `)
  
  console.table(rows)
  
  await connection.end()
}

checkDetail().catch(console.error)
