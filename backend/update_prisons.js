require('dotenv').config()
const mysql = require('mysql2/promise')

async function updatePrisons() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'paizhu_db'
  })

  console.log('=== 更新领导账号的监狱权限 ===\n')
  
  const allPrisons = JSON.stringify(['女子监狱', '男子监狱', '未成年犯管教所', '豫章监狱', '赣西监狱'])
  
  // 更新院领导
  await connection.query(`
    UPDATE users 
    SET prison_name = ? 
    WHERE username = 'yuanlingdao'
  `, [allPrisons])
  console.log('✓ 已更新院领导权限')
  
  // 更新系统管理员
  await connection.query(`
    UPDATE users 
    SET prison_name = ? 
    WHERE username = 'admin'
  `, [allPrisons])
  console.log('✓ 已更新系统管理员权限')
  
  // 查看结果
  const [users] = await connection.query(`
    SELECT id, username, role, prison_name 
    FROM users 
    WHERE role IN ('top_viewer', 'admin')
  `)
  
  console.log('\n更新后的数据:')
  console.table(users)
  
  await connection.end()
}

updatePrisons().catch(console.error)
