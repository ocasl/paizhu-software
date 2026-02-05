require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')

async function addUploadMonth() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'paizhu_db',
    multipleStatements: true
  })
  
  const sql = fs.readFileSync('./backend/add_upload_month.sql', 'utf8')
  await conn.query(sql)
  
  console.log('✓ upload_month 字段添加完成')
  
  await conn.end()
}

addUploadMonth().catch(console.error)
