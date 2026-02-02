const { User } = require('../models')

async function checkUsers() {
    try {
        const users = await User.findAll({
            where: {},
            attributes: ['id', 'username', 'name', 'prison_name', 'role']
        })
        
        console.log('所有用户：')
        console.log(JSON.stringify(users, null, 2))
    } catch (error) {
        console.error('查询失败:', error)
    } finally {
        process.exit(0)
    }
}

checkUsers()
