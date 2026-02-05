require('dotenv').config()
const mysql = require('mysql2/promise')

async function rollback() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'paizhu_db'
  })
  
  await conn.query('UPDATE users SET prison_name = NULL WHERE username IN ("yuanlingdao", "admin")')
  console.log('✓ 已回滚院领导和管理员的 prison_name')
  
  await conn.end()
}

rollback().catch(console.error)
