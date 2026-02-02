/**
 * 日检察记录模型
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const DailyLog = sequelize.define('DailyLog', {
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
        log_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '记录日期'
        },
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '派驻监所'
        },
        inspector_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '派驻人员'
        },
        // 三大现场检察
        three_scenes: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '三大现场检察数据',
            defaultValue: {
                labor: { checked: false, locations: [], focusPoints: [], issues: '' },
                living: { checked: false, locations: [], focusPoints: [], issues: '' },
                study: { checked: false, locations: [], focusPoints: [], issues: '' }
            }
        },
        // 严管禁闭检察
        strict_control: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '严管禁闭数据',
            defaultValue: { newCount: 0, totalCount: 0 }
        },
        // 警戒具检察
        police_equipment: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '警戒具检察数据',
            defaultValue: { checked: false, count: 0, issues: '' }
        },
        // 涉黑罪犯
        gang_prisoners: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '涉黑罪犯数据',
            defaultValue: { newCount: 0, totalCount: 0 }
        },
        // 收押/调出
        admission: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '收押调出数据',
            defaultValue: { inCount: 0, outCount: 0 }
        },
        // 监控抽查
        monitor_check: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '监控抽查数据',
            defaultValue: { checked: false, count: 0, anomalies: [] }
        },
        // 检察监督情况
        supervision_situation: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '检察监督情况'
        },
        // 采纳反馈情况
        feedback_situation: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '采纳反馈情况'
        },
        // 其他检察工作
        other_work: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '其他检察工作',
            defaultValue: { supervisionSituation: '', feedbackSituation: '' }
        },
        // 备注
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '备注'
        }
    }, {
        tableName: 'daily_logs',
        comment: '日检察记录表',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['log_date'] },
            { fields: ['user_id', 'log_date'] }
        ]
    })

    return DailyLog
}
