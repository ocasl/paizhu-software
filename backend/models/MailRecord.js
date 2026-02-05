/**
 * 信件汇总记录模型
 * 对应模板：信件汇总.xlsx
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const MailRecord = sequelize.define('MailRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sequence_no: {
            type: DataTypes.INTEGER,
            comment: '序号'
        },
        open_date: {
            type: DataTypes.DATEONLY,
            comment: '开箱日期'
        },
        prison_area: {
            type: DataTypes.STRING(50),
            comment: '监区'
        },
        prisoner_name: {
            type: DataTypes.STRING(50),
            comment: '罪犯名字'
        },
        reason: {
            type: DataTypes.TEXT,
            comment: '事由'
        },
        category: {
            type: DataTypes.STRING(50),
            comment: '类别'
        },
        remarks: {
            type: DataTypes.TEXT,
            comment: '备注'
        },
        // 派驻单位（数据隔离）
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '派驻监所名称'
        },
        // 数据归属月份（业务索引）
        upload_month: {
            type: DataTypes.STRING(7),
            comment: '数据归属月份 (YYYY-MM)'
        },
        // 同步信息
        sync_batch: {
            type: DataTypes.STRING(50),
            comment: '同步批次ID'
        },
        synced_at: {
            type: DataTypes.DATE,
            comment: '同步时间'
        }
    }, {
        tableName: 'mail_records',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['open_date'] },
            { fields: ['prison_area'] },
            { fields: ['prison_name'] },
            { fields: ['sync_batch'] }
        ]
    })

    return MailRecord
}
