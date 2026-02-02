/**
 * 测试文件上传命名逻辑
 * 运行此脚本验证文件命名是否正确
 */

const path = require('path')

// 模拟 multer 的文件对象
const testFile = {
    originalname: Buffer.from('测试图片.jpg', 'utf8').toString('latin1')  // 模拟 multer 的编码转换
}

console.log('=== 测试文件上传命名逻辑 ===\n')

// 测试1: 原始文件名（multer 接收到的）
console.log('1. Multer 接收到的文件名（latin1编码）:')
console.log('   ', testFile.originalname)
console.log('')

// 测试2: 修复编码
const originalName = Buffer.from(testFile.originalname, 'latin1').toString('utf8')
console.log('2. 修复编码后的文件名（utf8）:')
console.log('   ', originalName)
console.log('')

// 测试3: 提取基础文件名
const ext = path.extname(originalName)
const baseName = path.basename(originalName, ext)
console.log('3. 提取的基础文件名:')
console.log('   ', baseName)
console.log('   扩展名:', ext)
console.log('')

// 测试4: 清理特殊字符
const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
console.log('4. 清理后的文件名:')
console.log('   ', cleanBaseName)
console.log('')

// 测试5: 生成最终文件名
const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
const category = 'weekly_injury'
const timestamp = Date.now()
const formattedName = `${date}_${category}_${cleanBaseName}_${timestamp}${ext}`

console.log('5. 最终存储文件名:')
console.log('   ', formattedName)
console.log('')

// 测试6: 解析文件名
const parts = formattedName.split('_')
console.log('6. 解析文件名:')
console.log('   日期:', parts[0])
console.log('   类型:', parts[1] + '_' + parts[2])
console.log('   原始名:', parts.slice(3, -1).join('_'))
console.log('   时间戳:', parts[parts.length - 1].split('.')[0])
console.log('')

console.log('=== 测试完成 ===')
console.log('')
console.log('如果看到正确的中文文件名，说明逻辑正确。')
console.log('如果后端上传还是不对，请确保：')
console.log('1. 后端服务已经重启')
console.log('2. 没有使用 PM2 或其他进程管理器缓存旧代码')
console.log('3. 检查是否有多个后端实例在运行')
