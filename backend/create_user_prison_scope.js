require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')

async function createTable() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'paizhu_db',
    multipleStatements: true
  })
  
  const sql = fs.readFileSync('./backend/create_user_prison_scope.sql', 'utf8')
  await conn.query(sql)
  
  console.log('✓ 用户监狱权限关联表创建完成')
  
  await conn.end()
}

createTable().catch(console.error)
