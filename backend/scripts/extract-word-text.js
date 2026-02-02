/**
 * 提取Word文档的原始文本内容
 * 用于调试和查看文档格式
 */
const mammoth = require('mammoth')
const fs = require('fs')
const path = require('path')

async function extractText() {
    const filePath = path.join(__dirname, '../../test_templates/十月犯情动态.docx')
    
    console.log('========================================')
    console.log('提取Word文档原始文本')
    console.log('========================================\n')
    console.log(`文件: ${filePath}\n`)

    try {
        const buffer = fs.readFileSync(filePath)
        const result = await mammoth.extractRawText({ buffer })
        const text = result.value

        console.log('【原始文本内容】')
        console.log('========================================')
        console.log(text)
        console.log('========================================\n')

        console.log('【文本长度】', text.length, '字符\n')

        // 显示前500个字符
        console.log('【前500个字符】')
        console.log(text.substring(0, 500))
        console.log('...\n')

        // 保存到文件
        const outputPath = path.join(__dirname, 'extracted-text.txt')
        fs.writeFileSync(outputPath, text, 'utf8')
        console.log(`✓ 文本已保存到: ${outputPath}`)

    } catch (error) {
        console.error('❌ 提取失败:', error.message)
        console.error(error.stack)
    }
}

extractText()
