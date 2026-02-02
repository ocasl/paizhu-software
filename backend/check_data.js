// 检查数据关联情况
const db = require('./models')

async function check() {
    try {
        // 获取归档记录
        const archives = await db.MonthlyArchive.findAll()
        console.log('\n=== 归档记录 ===')
        for (const a of archives) {
            console.log(`ID: ${a.id}, 派驻单位: "${a.prison_name}", ${a.year}年${a.month}月`)
        }

        // 获取日志记录
        const logs = await db.DailyLog.findAll({ limit: 10 })
        console.log('\n=== 日志记录 ===')
        for (const l of logs) {
            console.log(`ID: ${l.id}, user_id: ${l.user_id}, 日期: ${l.log_date}`)
        }

        // 获取用户及其派驻单位
        const users = await db.User.findAll({ attributes: ['id', 'name', 'prison_name'] })
        console.log('\n=== 用户信息 ===')
        for (const u of users) {
            console.log(`ID: ${u.id}, 姓名: ${u.name}, 派驻单位: "${u.prison_name}"`)
        }

        // 检查归档的派驻单位是否与用户匹配
        if (archives.length > 0) {
            const archivePrison = archives[0].prison_name
            console.log(`\n=== 匹配检查 ===`)
            console.log(`归档的派驻单位: "${archivePrison}"`)

            const matchingUsers = users.filter(u => u.prison_name === archivePrison)
            console.log(`匹配的用户数: ${matchingUsers.length}`)

            if (matchingUsers.length > 0) {
                const userIds = matchingUsers.map(u => u.id)
                console.log(`匹配的用户ID: ${userIds.join(', ')}`)

                const matchingLogs = logs.filter(l => userIds.includes(l.user_id))
                console.log(`这些用户的日志数: ${matchingLogs.length}`)
            }
        }

    } catch (e) {
        console.error('Error:', e)
    }
    process.exit(0)
}

check()
