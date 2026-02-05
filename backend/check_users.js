require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'paizhu_db'
  })

  console.log('=== 检查用户数据 ===\n')
  
  const [users] = await connection.query(`
    SELECT id, username, role, prison_name 
    FROM users 
    ORDER BY role, id
  `)
  
  console.table(users)
  
  await connection.end()
}

checkUsers().catch(console.error)
