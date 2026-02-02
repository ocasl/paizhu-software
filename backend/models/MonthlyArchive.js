/**
 * 月度归档模型
 * 存储每月审批和归档信息
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const MonthlyArchive = sequelize.define('MonthlyArchive', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '年份'
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 12 },
            comment: '月份(1-12)'
        },
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '派驻监所名称'
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '提交人ID'
        },
        reviewer_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '审批人ID'
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
            defaultValue: 'draft',
            comment: '状态: draft-草稿, pending-待审批, approved-已通过, rejected-已驳回'
        },
        signature_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '审批签名图片路径'
        },
        reject_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '驳回原因'
        },
        archive_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: '压缩包文件路径'
        },
        summary: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '月度工作摘要'
        },
        daily_log_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '日志数量'
        },
        attachment_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '附件数量'
        },
        immediate_event_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '及时检察事件数量'
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '提交时间'
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '审批时间'
        }
    }, {
        tableName: 'monthly_archives',
        comment: '月度归档表',
        indexes: [
            {
                unique: true,
                fields: ['year', 'month', 'prison_name']
            }
        ]
    })

    return MonthlyArchive
}
