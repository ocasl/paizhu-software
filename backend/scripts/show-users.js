/**
 * 显示所有用户
 */
const { sequelize } = require('../models');

async function showUsers() {
    try {
        console.log('========================================');
        console.log('当前用户列表');
        console.log('========================================\n');

        const [users] = await sequelize.query('SELECT * FROM users');
        
        if (users.length === 0) {
            console.log('  (无用户)');
        } else {
            users.forEach(u => {
                console.log(`ID: ${u.id}`);
                console.log(`用户名: ${u.username}`);
                console.log(`姓名: ${u.name}`);
                console.log(`监所: ${u.prison_name || '(未设置)'}`);
                console.log(`角色: ${u.role}`);
                console.log(`状态: ${u.status}`);
                console.log('---');
            });
        }

        console.log('');
        console.log('========================================');
        console.log(`共 ${users.length} 个用户`);
        console.log('========================================');

        process.exit(0);
    } catch (error) {
        console.error('❌ 查询失败:', error.message);
        process.exit(1);
    }
}

showUsers();
