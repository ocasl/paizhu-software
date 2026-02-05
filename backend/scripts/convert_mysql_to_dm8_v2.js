/**
 * MySQL 到达梦数据库 SQL 转换工具 V2
 * 改进版本：更精确的语法转换
 */

const fs = require('fs')
const path = require('path')

/**
 * 转换单个建表语句
 */
function convertCreateTable(sql, tableName) {
  let result = sql
  let sequences = []
  
  // 1. 提取 AUTO_INCREMENT 字段并创建序列
  const autoIncrementMatch = result.match(/`(\w+)`\s+int\(\d+\)\s+NOT NULL\s+AUTO_INCREMENT/i)
  if (autoIncrementMatch) {
    const columnName = autoIncrementMatch[1]
    const sequenceName = `SEQ_${tableName.toUpperCase()}_${columnName.toUpperCase()}`
    
    // 创建序列
    sequences.push(`CREATE SEQUENCE ${sequenceName} START WITH 1 INCREMENT BY 1;`)
    
    // 替换 AUTO_INCREMENT 为默认值
    result = result.replace(
      /`(\w+)`\s+int\(\d+\)\s+NOT NULL\s+AUTO_INCREMENT/i,
      `${columnName} INT NOT NULL DEFAULT ${sequenceName}.NEXTVAL`
    )
  }
  
  // 2. 转换数据类型
  // INT(n) -> INT
  result = result.replace(/int\(\d+\)/gi, 'INT')
  result = result.replace(/tinyint\(1\)/gi, 'TINYINT')
  result = result.replace(/bigint\(\d+\)/gi, 'BIGINT')
  
  // JSON -> TEXT (达梦不支持 JSON)
  result = result.replace(/`(\w+)`\s+json/gi, '$1 TEXT')
  
  // ENUM -> VARCHAR + CHECK
  const enumMatches = result.matchAll(/`(\w+)`\s+enum\((.*?)\)/gi)
  for (const match of enumMatches) {
    const columnName = match[1]
    const values = match[2]
    result = result.replace(
      match[0],
      `${columnName} VARCHAR(50) CHECK (${columnName} IN (${values}))`
    )
  }
  
  // 3. 移除字符集和排序规则
  result = result.replace(/CHARACTER SET \w+/gi, '')
  result = result.replace(/COLLATE \w+/gi, '')
  
  // 4. 移除 USING BTREE/HASH
  result = result.replace(/USING (BTREE|HASH)/gi, '')
  
  // 5. 移除引擎选项
  result = result.replace(/ENGINE\s*=\s*\w+/gi, '')
  result = result.replace(/AUTO_INCREMENT\s*=\s*\d+/gi, '')
  result = result.replace(/ROW_FORMAT\s*=\s*\w+/gi, '')
  
  // 6. 移除反引号
  result = result.replace(/`/g, '')
  
  // 7. 转换 CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  result = result.replace(/DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'DEFAULT SYSDATE')
  result = result.replace(/DEFAULT CURRENT_TIMESTAMP/gi, 'DEFAULT SYSDATE')
  
  // 8. 清理多余的空格
  result = result.replace(/\s+/g, ' ').trim()
  
  return { sql: result, sequences }
}

/**
 * 主转换函数
 */
function convertMySQLToDM8(inputFile, outputFile) {
  console.log('='.repeat(80))
  console.log('MySQL 到达梦数据库 SQL 转换工具 V2')
  console.log('='.repeat(80))
  
  // 读取 MySQL SQL 文件
  console.log(`\n📖 读取文件: ${inputFile}`)
  const mysqlSql = fs.readFileSync(inputFile, 'utf8')
  
  // 分割成单独的语句
  const statements = mysqlSql.split(';').filter(s => s.trim())
  
  let dmSql = []
  let allSequences = []
  let tableCount = 0
  
  // 添加文件头
  dmSql.push('-- ============================================')
  dmSql.push('-- 达梦数据库建表脚本')
  dmSql.push('-- 从 MySQL 自动转换')
  dmSql.push(`-- 转换时间: ${new Date().toLocaleString('zh-CN')}`)
  dmSql.push('-- ============================================')
  dmSql.push('')
  dmSql.push('-- 注意事项：')
  dmSql.push('-- 1. JSON 字段已转换为 TEXT 类型')
  dmSql.push('-- 2. ENUM 字段已转换为 VARCHAR + CHECK 约束')
  dmSql.push('-- 3. AUTO_INCREMENT 已转换为序列（SEQUENCE）')
  dmSql.push('-- 4. 请先创建序列，再创建表')
  dmSql.push('')
  
  // 第一遍：收集所有序列
  console.log('\n🔍 第一遍扫描：收集序列...')
  for (const statement of statements) {
    const trimmed = statement.trim()
    
    if (trimmed.toUpperCase().includes('CREATE TABLE')) {
      const tableMatch = trimmed.match(/CREATE TABLE `?(\w+)`?/i)
      if (tableMatch) {
        const tableName = tableMatch[1]
        const converted = convertCreateTable(trimmed, tableName)
        if (converted.sequences.length > 0) {
          allSequences.push(...converted.sequences)
        }
      }
    }
  }
  
  // 添加所有序列
  if (allSequences.length > 0) {
    dmSql.push('-- ============================================')
    dmSql.push('-- 序列定义')
    dmSql.push('-- ============================================')
    dmSql.push('')
    allSequences.forEach(seq => {
      dmSql.push(seq)
    })
    dmSql.push('')
  }
  
  // 第二遍：转换表结构
  console.log('\n🔄 第二遍扫描：转换表结构...')
  dmSql.push('-- ============================================')
  dmSql.push('-- 表结构定义')
  dmSql.push('-- ============================================')
  dmSql.push('')
  
  for (const statement of statements) {
    const trimmed = statement.trim()
    
    // 跳过注释和空语句
    if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) {
      continue
    }
    
    // 跳过 SET 语句
    if (trimmed.toUpperCase().startsWith('SET ')) {
      continue
    }
    
    // 处理 DROP TABLE
    if (trimmed.toUpperCase().includes('DROP TABLE')) {
      const dropMatch = trimmed.match(/DROP TABLE IF EXISTS `?(\w+)`?/i)
      if (dropMatch) {
        const tableName = dropMatch[1]
        dmSql.push(`-- 删除表: ${tableName}`)
        dmSql.push(`DROP TABLE IF EXISTS ${tableName};`)
        dmSql.push('')
      }
      continue
    }
    
    // 处理 CREATE TABLE
    if (trimmed.toUpperCase().includes('CREATE TABLE')) {
      const tableMatch = trimmed.match(/CREATE TABLE `?(\w+)`?/i)
      if (tableMatch) {
        const tableName = tableMatch[1]
        console.log(`   转换表: ${tableName}`)
        
        const converted = convertCreateTable(trimmed, tableName)
        
        // 添加建表语句
        dmSql.push(`-- 表: ${tableName}`)
        dmSql.push(converted.sql + ';')
        dmSql.push('')
        
        tableCount++
      }
    }
  }
  
  // 写入输出文件
  console.log(`\n💾 写入文件: ${outputFile}`)
  fs.writeFileSync(outputFile, dmSql.join('\n'), 'utf8')
  
  console.log('\n' + '='.repeat(80))
  console.log('✅ 转换完成！')
  console.log(`   转换表数量: ${tableCount}`)
  console.log(`   生成序列数: ${allSequences.length}`)
  console.log(`   输出文件: ${outputFile}`)
  console.log('='.repeat(80))
  
  // 生成安装指南
  const guideFile = outputFile.replace('.sql', '_install_guide.md')
  const guide = [
    '# 达梦数据库安装指南',
    '',
    '## 1. 安装达梦数据库',
    '',
    '1. 下载达梦数据库 DM8 安装包',
    '2. 运行安装程序，选择"典型安装"',
    '3. 设置数据库实例名：PAIZHU',
    '4. 设置管理员密码（SYSDBA）',
    '5. 完成安装',
    '',
    '## 2. 创建数据库用户',
    '',
    '```sql',
    '-- 使用 SYSDBA 登录',
    'CREATE USER paizhu_user IDENTIFIED BY "your_password";',
    'GRANT DBA TO paizhu_user;',
    '```',
    '',
    '## 3. 执行建表脚本',
    '',
    '```bash',
    '# 使用 disql 命令行工具',
    'disql paizhu_user/your_password@localhost:5236',
    '',
    '# 执行脚本',
    `START ${path.basename(outputFile)};`,
    '```',
    '',
    '## 4. 验证安装',
    '',
    '```sql',
    '-- 查看所有表',
    'SELECT TABLE_NAME FROM USER_TABLES;',
    '',
    '-- 查看所有序列',
    'SELECT SEQUENCE_NAME FROM USER_SEQUENCES;',
    '',
    '-- 查看表数量',
    'SELECT COUNT(*) FROM USER_TABLES;',
    '```',
    '',
    '## 5. 配置 Node.js 连接',
    '',
    '```bash',
    '# 安装达梦驱动',
    'npm install dmdb --save',
    '```',
    '',
    '```javascript',
    '// backend/config/database.js',
    'const { Sequelize } = require("sequelize")',
    '',
    'const sequelize = new Sequelize({',
    '  dialect: "postgres",  // 使用 postgres 方言',
    '  dialectModule: require("dmdb"),  // 使用达梦驱动',
    '  host: "localhost",',
    '  port: 5236,',
    '  database: "PAIZHU",',
    '  username: "paizhu_user",',
    '  password: "your_password",',
    '  logging: console.log',
    '})',
    '```',
    '',
    '## 6. 数据迁移',
    '',
    '```bash',
    '# 从 MySQL 导出数据',
    'mysqldump -u root -p --no-create-info paizhu_db > data.sql',
    '',
    '# 转换并导入到达梦',
    '# 需要手动调整 INSERT 语句中的语法差异',
    '```',
    '',
    '## 7. 常见问题',
    '',
    '### Q: 序列如何使用？',
    'A: 使用 `SEQUENCE_NAME.NEXTVAL` 获取下一个值',
    '',
    '### Q: JSON 字段如何处理？',
    'A: 已转换为 TEXT，需要在应用层序列化/反序列化',
    '',
    '### Q: ENUM 字段如何处理？',
    'A: 已转换为 VARCHAR + CHECK 约束',
    '',
    '### Q: 如何回滚到 MySQL？',
    'A: 修改 .env 文件中的 DB_TYPE=mysql，重启服务',
    ''
  ]
  
  fs.writeFileSync(guideFile, guide.join('\n'), 'utf8')
  console.log(`\n📖 安装指南: ${guideFile}`)
}

// 执行转换
const inputFile = path.join(__dirname, '../paizhu_db.sql')
const outputFile = path.join(__dirname, '../paizhu_db_dm8_v2.sql')

try {
  convertMySQLToDM8(inputFile, outputFile)
} catch (error) {
  console.error('❌ 转换失败:', error)
  process.exit(1)
}
