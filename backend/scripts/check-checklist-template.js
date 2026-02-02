/**
 * 检查清单模板中的占位符
 */
const fs = require('fs')
const path = require('path')
const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')

const TEMPLATE_PATH = path.join(__dirname, '../muban/派驻检察工作报告事项清单_with_placeholders.docx')

console.log('检查模板文件:', TEMPLATE_PATH)
console.log('文件存在:', fs.existsSync(TEMPLATE_PATH))

if (fs.existsSync(TEMPLATE_PATH)) {
    try {
        const content = fs.readFileSync(TEMPLATE_PATH, 'binary')
        const zip = new PizZip(content)
        
        // 提取document.xml查看占位符
        const documentXml = zip.files['word/document.xml'].asText()
        
        // 查找所有{xxx}格式的占位符
        const placeholders = documentXml.match(/\{[^}]+\}/g)
        
        if (placeholders) {
            console.log('\n找到的占位符:')
            const uniquePlaceholders = [...new Set(placeholders)]
            uniquePlaceholders.sort().forEach(p => {
                console.log('  ', p)
            })
            console.log('\n总共:', uniquePlaceholders.length, '个唯一占位符')
        } else {
            console.log('\n未找到任何占位符')
        }
        
        // 检查是否有content1-16
        const hasContent = uniquePlaceholders.some(p => p.includes('content'))
        console.log('\n是否包含content占位符:', hasContent)
        
    } catch (error) {
        console.error('读取模板失败:', error.message)
    }
}
