/**
 * 涉黑恶名单模型
 * 对应模板：涉黑恶名单.xls
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Blacklist = sequelize.define('Blacklist', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        prisoner_id: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: '罪犯编号（与prison_name组合唯一）'
        },
        name: {
            type: DataTypes.STRING(50),
            comment: '姓名'
        },
        gender: {
            type: DataTypes.STRING(10),
            comment: '性别'
        },
        ethnicity: {
            type: DataTypes.STRING(20),
            comment: '民族'
        },
        birth_date: {
            type: DataTypes.DATEONLY,
            comment: '出生日期'
        },
        native_place: {
            type: DataTypes.STRING(100),
            comment: '籍贯/国籍'
        },
        political_status: {
            type: DataTypes.STRING(50),
            comment: '捕前面貌'
        },
        crime: {
            type: DataTypes.STRING(200),
            comment: '原判罪名'
        },
        original_term: {
            type: DataTypes.STRING(20),
            comment: '原判刑期'
        },
        term_start: {
            type: DataTypes.DATEONLY,
            comment: '原判刑期起日'
        },
        term_end: {
            type: DataTypes.DATEONLY,
            comment: '原判刑期止日'
        },
        admission_date: {
            type: DataTypes.DATEONLY,
            comment: '入监日期'
        },
        involvement_type: {
            type: DataTypes.STRING(20),
            comment: '三涉情况：涉黑/涉恶等'
        },
        custody_status: {
            type: DataTypes.STRING(50),
            comment: '在押现状'
        },
        sentence_change: {
            type: DataTypes.TEXT,
            comment: '刑罚变动情况'
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
        tableName: 'blacklists',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['prisoner_id', 'prison_name'] },
            { fields: ['involvement_type'] },
            { fields: ['prison_name'] },
            { fields: ['sync_batch'] }
        ]
    })

    return Blacklist
}
