/**
 * 周检察记录模型
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const WeeklyRecord = sequelize.define('WeeklyRecord', {
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
        record_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '记录日期'
        },
        week_number: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '第几周'
        },
        // 医院/禁闭室检察
        hospital_check: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '医院禁闭室检察',
            defaultValue: {
                hospitalChecked: false,
                confinementChecked: false,
                policeWeaponIssues: '',
                confinementCount: 0,
                strictControlCount: 0
            }
        },
        // 外伤检察
        injury_check: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '外伤检察',
            defaultValue: { count: 0, description: '' }
        },
        // 谈话记录
        talk_records: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '谈话记录列表',
            defaultValue: []
        },
        // 检察官信箱
        mailbox: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '检察官信箱',
            defaultValue: { openCount: 0, receivedCount: 0, caseClues: [] }
        },
        // 违禁品检查
        contraband: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '违禁品检查',
            defaultValue: { checked: false, foundItems: [] }
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
        tableName: 'weekly_records',
        comment: '周检察记录表',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['record_date'] },
            { fields: ['log_id'] },
            { fields: ['log_date'] }
        ]
    })

    return WeeklyRecord
}
