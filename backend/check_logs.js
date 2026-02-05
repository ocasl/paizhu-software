require('dotenv').config()
const mysql = require('mysql2/promise')

async function checkLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'paizhu_db'
  })

  console.log('=== 检查日志数据 ===\n')
  
  // 检查日检查日志
  const [dailyLogs] = await connection.query('SELECT COUNT(*) as count, prison_name FROM daily_logs GROUP BY prison_name')
  console.log('日检查日志统计:')
  console.table(dailyLogs)
  
  // 检查周检察记录
  const [weeklyRecords] = await connection.query('SELECT COUNT(*) as count, prison_name FROM weekly_records GROUP BY prison_name')
  console.log('\n周检察记录统计:')
  console.table(weeklyRecords)
  
  // 检查月检察记录
  const [monthlyRecords] = await connection.query('SELECT COUNT(*) as count, prison_name FROM monthly_records GROUP BY prison_name')
  console.log('\n月检察记录统计:')
  console.table(monthlyRecords)
  
  // 检查及时检察事件
  const [immediateEvents] = await connection.query('SELECT COUNT(*) as count, prison_name FROM immediate_events GROUP BY prison_name')
  console.log('\n及时检察事件统计:')
  console.table(immediateEvents)
  
  await connection.end()
}

checkLogs().catch(console.error)
