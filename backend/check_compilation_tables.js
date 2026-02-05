/**
 * 检查汇编功能数据库表是否存在
 */
const { sequelize } = require('./models')

async function checkTables() {
    try {
        console.log('检查汇编功能数据库表...')
        
        // 检查 compilation_categories 表
        const [categories] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'paizhu_db' 
            AND table_name = 'compilation_categories'
        `)
        
        if (categories[0].count > 0) {
            console.log('✅ compilation_categories 表存在')
            
            // 查询分类数据
            const [catData] = await sequelize.query('SELECT * FROM compilation_categories')
            console.log(`   - 共有 ${catData.length} 个分类`)
        } else {
            console.log('❌ compilation_categories 表不存在')
        }
        
        // 检查 compilation_documents 表
        const [documents] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'paizhu_db' 
            AND table_name = 'compilation_documents'
        `)
        
        if (documents[0].count > 0) {
            console.log('✅ compilation_documents 表存在')
            
            // 查询文档数据
            const [docData] = await sequelize.query('SELECT * FROM compilation_documents')
            console.log(`   - 共有 ${docData.length} 个文档`)
        } else {
            console.log('❌ compilation_documents 表不存在')
        }
        
        console.log('\n如果表不存在，请运行：')
        console.log('mysql -u root -p paizhu_db < backend/migrations/create_compilation_tables.sql')
        
    } catch (error) {
        console.error('检查失败:', error.message)
    } finally {
        await sequelize.close()
    }
}

checkTables()
