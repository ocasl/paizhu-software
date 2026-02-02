/**
 * 及时检察事件模型
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const ImmediateEvent = sequelize.define('ImmediateEvent', {
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
        event_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '事件日期'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '事件标题'
        },
        event_type: {
            type: DataTypes.ENUM(
                'escape',           // 脱逃
                'selfHarm',         // 自伤自残
                'death',            // 死亡
                'epidemic',         // 重大疫情
                'accident',         // 安全事故
                'paroleRequest',    // 减刑假释
                'disciplinaryAction' // 民警处分
            ),
            allowNull: false,
            comment: '事件类型'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '事件描述'
        },
        // 减刑假释专用字段
        parole_data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '减刑假释数据',
            defaultValue: null
        },
        // 附件列表
        attachment_ids: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '相关附件ID列表',
            defaultValue: []
        },
        status: {
            type: DataTypes.ENUM('pending', 'processed', 'closed'),
            defaultValue: 'pending',
            comment: '处理状态'
        }
    }, {
        tableName: 'immediate_events',
        comment: '及时检察事件表',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['event_date'] },
            { fields: ['event_type'] }
        ]
    })

    return ImmediateEvent
}
