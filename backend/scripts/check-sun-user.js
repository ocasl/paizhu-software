require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { User } = require('../models')

async function checkUser() {
    try {
        // 查找孙检察官
        const user = await User.findOne({
            where: { name: '孙检察官' },
            attributes: ['id', 'username', 'name', 'prison_name', 'role']
        })
        
        if (user) {
            console.log('找到用户：')
            console.log(JSON.stringify(user.toJSON(), null, 2))
        } else {
            console.log('未找到孙检察官')
            
            // 列出所有检察官
            const allUsers = await User.findAll({
                where: { role: 'inspector' },
                attributes: ['id', 'username', 'name', 'prison_name', 'role']
            })
            console.log('\n所有检察官：')
            allUsers.forEach(u => {
                console.log(`- ${u.name} (${u.username}): ${u.prison_name}`)
            })
        }
    } catch (error) {
        console.error('查询失败:', error.message)
    } finally {
        process.exit(0)
    }
}

checkUser()
