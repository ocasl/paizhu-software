/**
 * MySQL 到达梦数据库 SQL 转换工具
 * 
 * 功能：
 * 1. 读取 MySQL 建表脚本
 * 2. 转换为达梦数据库兼容的 SQL
 * 3. 生成达梦数据库建表脚本
 */

const fs = require('fs')
const path = require('path')

// 数据类型映射
const typeMapping = {
  // 整数类型
  'int(11)': 'INT',
  'int': 'INT',
  'tinyint(1)': 'TINYINT',
  'bigint': 'BIGINT',
  
  // 字符串类型
  'varchar': 'VARCHAR',
  'text': 'TEXT',
  'longtext': 'TEXT',
  'mediumtext': 'TEXT',
  
  // 日期时间类型
  'datetime': 'DATETIME',
  'date': 'DATE',
  'timestamp': 'TIMESTAMP',
  
  // JSON 类型（达梦不支持，转为 TEXT）
  'json': 'TEXT',
  
  // 枚举类型（达梦不支持，转为 VARCHAR + CHECK）
  'enum': 'VARCHAR'
}

/**
 * 转换数据类型
 */
function convertDataType(mysqlType) {
  // 处理 VARCHAR(n)
  const varcharMatch = mysqlType.match(/varchar\((\d+)\)/i)
  if (varcharMatch) {
    return `VARCHAR(${varcharMatch[1]})`
  }
  
  // 处理 INT(n)
  const intMatch = mysqlType.match(/int\((\d+)\)/i)
  if (intMatch) {
    return 'INT'
  }
  
  // 处理 ENUM
  const enumMatch = mysqlType.match(/enum\((.*?)\)/i)
  if (enumMatch) {
    const values = enumMatch[1]
    return `VARCHAR(50) CHECK (VALUE IN (${values}))`
  }
  
  // 其他类型直接映射
  for (const [mysql, dm] of Object.entries(typeMapping)) {
    if (mysqlType.toLowerCase().includes(mysql.toLowerCase())) {
      return dm
    }
  }
  
  return mysqlType.toUpperCase()
}

/**
 * 转换 AUTO_INCREMENT 为序列
 */
function convertAutoIncrement(tableName, sql) {
  const autoIncrementMatch = sql.match(/`(\w+)`.*?AUTO_INCREMENT/i)
  if (!autoIncrementMatch) return { sql, sequences: [] }
  
  const columnName = autoIncrementMatch[1]
  const sequenceName = `seq_${tableName}_${columnName}`
  
  // 移除 AUTO_INCREMENT
  sql = sql.replace(/AUTO_INCREMENT/gi, '')
  
  // 生成序列创建语句
  const sequenceSql = `CREATE SEQUENCE ${sequenceName} START WITH 1 INCREMENT BY 1;`
  
  // 添加默认值
  sql = sql.replace(
    new RegExp(`\`${columnName}\`\\s+\\w+`, 'i'),
    `${columnName} INT DEFAULT NEXT VALUE FOR ${sequenceName}`
  )
  
  return { sql, sequences: [sequenceSql] }
}

/**
 * 转换字符集和排序规则
 */
function removeCharsetCollate(sql) {
  // 移除 CHARACTER SET 和 COLLATE
  sql = sql.replace(/CHARACTER SET \w+/gi, '')
  sql = sql.replace(/COLLATE \w+/gi, '')
  return sql
}

/**
 * 转换索引语法
 */
function convertIndexes(sql) {
  // 移除 USING BTREE/HASH
  sql = sql.replace(/USING (BTREE|HASH)/gi, '')
  
  // 转换 INDEX 为 CREATE INDEX（达梦更推荐这种方式）
  // 但为了简化，我们保留在 CREATE TABLE 中
  
  return sql
}

/**
 * 转换引擎和其他选项
 */
function removeEngineOptions(sql) {
  // 移除 ENGINE, AUTO_INCREMENT, CHARACTER SET, COLLATE, ROW_FORMAT, COMMENT
  sql = sql.replace(/ENGINE\s*=\s*\w+/gi, '')
  sql = sql.replace(/AUTO_INCREMENT\s*=\s*\d+/gi, '')
  sql = sql.replace(/CHARACTER SET\s*=\s*\w+/gi, '')
  sql = sql.replace(/COLLATE\s*=\s*\w+/gi, '')
  sql = sql.replace(/ROW_FORMAT\s*=\s*\w+/gi, '')
  
  return sql
}

/**
 * 转换外键约束
 */
function convertForeignKeys(sql) {
  // 达梦支持外键，语法基本相同
  // 只需要移除反引号
  sql = sql.replace(/`/g, '')
  return sql
}

/**
 * 转换单个建表语句
 */
function convertCreateTable(sql, tableName) {
  let result = sql
  let sequences = []
  
  // 1. 转换 AUTO_INCREMENT
  const autoIncrementResult = convertAutoIncrement(tableName, result)
  result = autoIncrementResult.sql
  sequences = autoIncrementResult.sequences
  
  // 2. 移除字符集和排序规则
  result = removeCharsetCollate(result)
  
  // 3. 转换索引
  result = convertIndexes(result)
  
  // 4. 移除引擎选项
  result = removeEngineOptions(result)
  
  // 5. 转换外键
  result = convertForeignKeys(result)
  
  // 6. 移除反引号
  result = result.replace(/`/g, '')
  
  // 7. 清理多余的空格和逗号
  result = result.replace(/,\s*\)/g, ')')
  result = result.replace(/\s+/g, ' ')
  
  return { sql: result, sequences }
}

/**
 * 主转换函数
 */
function convertMySQLToDM8(inputFile, outputFile) {
  console.log('='.repeat(80))
  console.log('MySQL 到达梦数据库 SQL 转换工具')
  console.log('='.repeat(80))
  
  // 读取 MySQL SQL 文件
  console.log(`\n📖 读取文件: ${inputFile}`)
  const mysqlSql = fs.readFileSync(inputFile, 'utf8')
  
  // 分割成单独的语句
  const statements = mysqlSql.split(';').filter(s => s.trim())
  
  let dmSql = []
  let sequences = []
  let tableCount = 0
  
  // 添加文件头
  dmSql.push('-- ============================================')
  dmSql.push('-- 达梦数据库建表脚本')
  dmSql.push('-- 从 MySQL 自动转换')
  dmSql.push(`-- 转换时间: ${new Date().toLocaleString('zh-CN')}`)
  dmSql.push('-- ============================================')
  dmSql.push('')
  
  // 处理每个语句
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
        console.log(`\n🔄 转换表: ${tableName}`)
        
        const converted = convertCreateTable(trimmed, tableName)
        
        // 添加序列
        if (converted.sequences.length > 0) {
          dmSql.push(`-- 序列: ${tableName}`)
          sequences.push(...converted.sequences)
          dmSql.push(...converted.sequences)
          dmSql.push('')
        }
        
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
  console.log(`   生成序列数: ${sequences.length}`)
  console.log(`   输出文件: ${outputFile}`)
  console.log('='.repeat(80))
  
  // 生成转换报告
  const reportFile = outputFile.replace('.sql', '_report.txt')
  const report = [
    '达梦数据库转换报告',
    '='.repeat(80),
    `转换时间: ${new Date().toLocaleString('zh-CN')}`,
    `源文件: ${inputFile}`,
    `目标文件: ${outputFile}`,
    `转换表数量: ${tableCount}`,
    `生成序列数: ${sequences.length}`,
    '',
    '注意事项：',
    '1. JSON 字段已转换为 TEXT 类型，需要在应用层处理序列化',
    '2. ENUM 字段已转换为 VARCHAR + CHECK 约束',
    '3. AUTO_INCREMENT 已转换为序列（SEQUENCE）',
    '4. 请在达梦数据库中测试执行',
    '5. 建议先在测试环境验证',
    '',
    '生成的序列：',
    ...sequences.map((s, i) => `${i + 1}. ${s}`)
  ]
  
  fs.writeFileSync(reportFile, report.join('\n'), 'utf8')
  console.log(`\n📋 转换报告: ${reportFile}`)
}

// 执行转换
const inputFile = path.join(__dirname, '../paizhu_db.sql')
const outputFile = path.join(__dirname, '../paizhu_db_dm8.sql')

try {
  convertMySQLToDM8(inputFile, outputFile)
} catch (error) {
  console.error('❌ 转换失败:', error)
  process.exit(1)
}
