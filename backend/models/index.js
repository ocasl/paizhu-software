/**
 * Sequelize 模型索引
 * 导出所有数据模型和数据库连接
 */
const { Sequelize } = require('sequelize')
const config = require('../config/database')

const env = process.env.NODE_ENV || 'development'
const dbConfig = config[env]

// 创建 Sequelize 实例
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        timezone: dbConfig.timezone,
        define: dbConfig.define,
        pool: dbConfig.pool
    }
)

// 导入模型
const User = require('./User')(sequelize)
const UserPrisonScope = require('./UserPrisonScope')(sequelize)
const DailyLog = require('./DailyLog')(sequelize)
const WeeklyRecord = require('./WeeklyRecord')(sequelize)
const MonthlyRecord = require('./MonthlyRecord')(sequelize)
const ImmediateEvent = require('./ImmediateEvent')(sequelize)
const Attachment = require('./Attachment')(sequelize)
const MonthlyArchive = require('./MonthlyArchive')(sequelize)

// 模板同步相关模型
const Prisoner = require('./Prisoner')(sequelize)
const StrictEducation = require('./StrictEducation')(sequelize)
const Confinement = require('./Confinement')(sequelize)
const RestraintUsage = require('./RestraintUsage')(sequelize)
const MailRecord = require('./MailRecord')(sequelize)
const Blacklist = require('./Blacklist')(sequelize)
const CriminalReport = require('./CriminalReport')(sequelize)

// 定义关联关系
// 用户与监狱范围
User.hasMany(UserPrisonScope, { foreignKey: 'user_id', as: 'prisonScopes' })
UserPrisonScope.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 用户有多条日志
User.hasMany(DailyLog, { foreignKey: 'user_id', as: 'dailyLogs' })
DailyLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(WeeklyRecord, { foreignKey: 'user_id', as: 'weeklyRecords' })
WeeklyRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(MonthlyRecord, { foreignKey: 'user_id', as: 'monthlyRecords' })
MonthlyRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(ImmediateEvent, { foreignKey: 'user_id', as: 'immediateEvents' })
ImmediateEvent.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

User.hasMany(Attachment, { foreignKey: 'user_id', as: 'attachments' })
Attachment.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 月度归档关联
User.hasMany(MonthlyArchive, { foreignKey: 'user_id', as: 'submittedArchives' })
MonthlyArchive.belongsTo(User, { foreignKey: 'user_id', as: 'submitter' })
MonthlyArchive.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' })

module.exports = {
    sequelize,
    Sequelize,
    User,
    UserPrisonScope,
    DailyLog,
    WeeklyRecord,
    MonthlyRecord,
    ImmediateEvent,
    Attachment,
    MonthlyArchive,
    // 模板同步相关
    Prisoner,
    StrictEducation,
    Confinement,
    RestraintUsage,
    MailRecord,
    Blacklist,
    CriminalReport
}
