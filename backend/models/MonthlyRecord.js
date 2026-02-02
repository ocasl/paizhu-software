/**
 * 月检察记录模型
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const MonthlyRecord = sequelize.define('MonthlyRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '用户ID'
        },
        record_month: {
            type: DataTypes.STRING(7),
            allowNull: false,
            comment: '记录月份 YYYY-MM'
        },
        // 会见检察
        visit_check: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '会见检察',
            defaultValue: { checked: false, visitCount: 0, issues: '' }
        },
        // 会议参加
        meeting: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '会议参加情况',
            defaultValue: { participated: false, meetingType: '', notes: '' }
        },
        // 处分监督
        punishment: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '处分监督',
            defaultValue: { recordCount: 0, confinementCount: 0 }
        },
        // 岗位统计
        position_stats: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '岗位增减统计',
            defaultValue: {
                miscellaneousIncrease: 0,
                miscellaneousDecrease: 0,
                productionIncrease: 0,
                productionDecrease: 0
            }
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '备注'
        },
        log_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '关联的日志ID'
        },
        log_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: '关联的日志日期'
        }
    }, {
        tableName: 'monthly_records',
        comment: '月检察记录表',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['record_month'] },
            { fields: ['log_id'] },
            { fields: ['log_date'] }
        ]
    })

    return MonthlyRecord
}
