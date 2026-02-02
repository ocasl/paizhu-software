/**
 * 查看用户的监狱范围配置
 */
require('dotenv').config()
const { User, UserPrisonScope } = require('../models')

async function checkPrisonScopes() {
    try {
        console.log('查询所有用户的监狱范围配置...\n')
        
        // 查询所有用户
        const users = await User.findAll({
            attributes: ['id', 'username', 'name', 'role', 'prison_name']
        })
        
        console.log('=== 用户列表 ===')
        for (const user of users) {
            console.log(`\n用户ID: ${user.id}`)
            console.log(`  用户名: ${user.username}`)
            console.log(`  姓名: ${user.name}`)
            console.log(`  角色: ${user.role}`)
            console.log(`  所属监狱: ${user.prison_name || '无'}`)
            
            // 查询该用户的监狱范围
            const scopes = await UserPrisonScope.findAll({
                where: { user_id: user.id }
            })
            
            if (scopes.length > 0) {
                console.log(`  分管监狱范围 (${scopes.length}个):`)
                scopes.forEach(scope => {
                    console.log(`    - ${scope.prison_name}`)
                })
            } else {
                console.log(`  分管监狱范围: 无配置`)
            }
        }
        
        console.log('\n' + '='.repeat(80))
        
        // 统计
        const totalScopes = await UserPrisonScope.count()
        console.log(`\n总计: ${users.length} 个用户, ${totalScopes} 条监狱范围配置`)
        
        process.exit(0)
    } catch (error) {
        console.error('查询失败:', error)
        process.exit(1)
    }
}

checkPrisonScopes()
