/**
 * 创建演示用户
 * 包括不同角色和派驻单位的用户
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const { User, UserPrisonScope } = require('../models')

async function createDemoUsers() {
    try {
        console.log('开始创建演示用户...\n')
        
        // 默认密码
        const defaultPassword = '123456'
        const hashedPassword = await bcrypt.hash(defaultPassword, 10)
        
        // 定义要创建的用户
        const users = [
            // 1. 系统管理员
            {
                username: 'admin',
                password: hashedPassword,
                name: '系统管理员',
                prison_name: null,
                role: 'admin',
                phone: '13800000000',
                status: 'active'
            },
            
            // 2. 院领导（可以查看所有监狱）
            {
                username: 'yuanlingdao',
                password: hashedPassword,
                name: '张院长',
                prison_name: null,
                role: 'top_viewer',
                phone: '13800000001',
                status: 'active',
                scopes: ['女子监狱', '男子监狱', '未成年犯管教所', '豫章监狱']
            },
            
            // 3. 分管领导1（分管女子监狱和男子监狱）
            {
                username: 'lingdao1',
                password: hashedPassword,
                name: '李主任',
                prison_name: '女子监狱',
                role: 'leader',
                phone: '13800000002',
                status: 'active',
                scopes: ['女子监狱', '男子监狱']
            },
            
            // 4. 分管领导2（分管未成年犯管教所和豫章监狱）
            {
                username: 'lingdao2',
                password: hashedPassword,
                name: '王主任',
                prison_name: '未成年犯管教所',
                role: 'leader',
                phone: '13800000003',
                status: 'active',
                scopes: ['未成年犯管教所', '豫章监狱']
            },
            
            // 5. 女子监狱检察员1
            {
                username: 'nvzi_jcy1',
                password: hashedPassword,
                name: '陈检察官',
                prison_name: '女子监狱',
                role: 'inspector',
                phone: '13800000011',
                status: 'active'
            },
            
            // 6. 女子监狱检察员2
            {
                username: 'nvzi_jcy2',
                password: hashedPassword,
                name: '刘检察官',
                prison_name: '女子监狱',
                role: 'inspector',
                phone: '13800000012',
                status: 'active'
            },
            
            // 7. 男子监狱检察员1
            {
                username: 'nanzi_jcy1',
                password: hashedPassword,
                name: '赵检察官',
                prison_name: '男子监狱',
                role: 'inspector',
                phone: '13800000021',
                status: 'active'
            },
            
            // 8. 男子监狱检察员2
            {
                username: 'nanzi_jcy2',
                password: hashedPassword,
                name: '孙检察官',
                prison_name: '男子监狱',
                role: 'inspector',
                phone: '13800000022',
                status: 'active'
            },
            
            // 9. 未成年犯管教所检察员
            {
                username: 'wcn_jcy',
                password: hashedPassword,
                name: '周检察官',
                prison_name: '未成年犯管教所',
                role: 'inspector',
                phone: '13800000031',
                status: 'active'
            },
            
            // 10. 豫章监狱检察员
            {
                username: 'yuzhang_jcy',
                password: hashedPassword,
                name: '吴检察官',
                prison_name: '豫章监狱',
                role: 'inspector',
                phone: '13800000041',
                status: 'active'
            }
        ]
        
        console.log('=' .repeat(80))
        console.log('将创建以下用户:')
        console.log('=' .repeat(80))
        
        for (const userData of users) {
            console.log(`\n${userData.name} (${userData.username})`)
            console.log(`  角色: ${userData.role}`)
            console.log(`  派驻单位: ${userData.prison_name || '无'}`)
            if (userData.scopes) {
                console.log(`  分管范围: ${userData.scopes.join(', ')}`)
            }
        }
        
        console.log('\n' + '=' .repeat(80))
        console.log('确认创建? (将删除已存在的同名用户)')
        console.log('=' .repeat(80))
        
        // 开始创建
        for (const userData of users) {
            const scopes = userData.scopes
            delete userData.scopes
            
            // 删除已存在的用户
            await User.destroy({ where: { username: userData.username } })
            
            // 创建用户
            const user = await User.create(userData)
            console.log(`✓ 创建用户: ${user.name} (${user.username})`)
            
            // 如果有分管范围，创建监狱范围记录
            if (scopes && scopes.length > 0) {
                for (const prisonName of scopes) {
                    await UserPrisonScope.create({
                        user_id: user.id,
                        prison_name: prisonName
                    })
                }
                console.log(`  ✓ 配置分管范围: ${scopes.join(', ')}`)
            }
        }
        
        console.log('\n' + '=' .repeat(80))
        console.log('✅ 所有用户创建完成！')
        console.log('=' .repeat(80))
        console.log('\n默认密码: 123456')
        console.log('\n用户列表:')
        console.log('-'.repeat(80))
        console.log('角色\t\t用户名\t\t姓名\t\t派驻单位')
        console.log('-'.repeat(80))
        
        for (const userData of users) {
            const roleMap = {
                'admin': '管理员',
                'top_viewer': '院领导',
                'leader': '分管领导',
                'inspector': '检察员'
            }
            console.log(`${roleMap[userData.role]}\t\t${userData.username}\t\t${userData.name}\t\t${userData.prison_name || '全部'}`)
        }
        
        console.log('-'.repeat(80))
        
        process.exit(0)
    } catch (error) {
        console.error('创建用户失败:', error)
        process.exit(1)
    }
}

createDemoUsers()
