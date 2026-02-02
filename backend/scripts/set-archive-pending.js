/**
 * 将指定归档设置为待审批状态
 */
const { MonthlyArchive } = require('../models');

async function main() {
    try {
        // 查找2026年1月的归档
        const archive = await MonthlyArchive.findOne({
            where: {
                year: 2026,
                month: 1
            }
        });

        if (!archive) {
            console.log('❌ 未找到2026年1月的归档');
            process.exit(1);
        }

        console.log('找到归档:', {
            id: archive.id,
            prison_name: archive.prison_name,
            status: archive.status
        });

        // 更新为待审批状态
        await archive.update({
            status: 'pending',
            submitted_at: new Date()
        });

        console.log('✅ 归档状态已更新为: pending (待审批)');
        console.log('\n现在可以:');
        console.log('1. 用领导账号登录');
        console.log('2. 进入"月度归档管理"页面');
        console.log('3. 看到"通过"和"退回"按钮');

    } catch (error) {
        console.error('❌ 操作失败:', error);
        process.exit(1);
    }
}

main();
