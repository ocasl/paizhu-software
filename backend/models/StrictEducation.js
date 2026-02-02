/**
 * 严管教育记录模型
 * 对应模板：严管教育审批.xlsx
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const StrictEducation = sequelize.define('StrictEducation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        prisoner_id: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: '罪犯编号'
        },
        create_date: {
            type: DataTypes.DATEONLY,
            comment: '制单时间'
        },
        applicable_clause: {
            type: DataTypes.TEXT,
            comment: '适用条款'
        },
        reason: {
            type: DataTypes.TEXT,
            comment: '严管教育原因'
        },
        days: {
            type: DataTypes.INTEGER,
            comment: '严管天数'
        },
        start_date: {
            type: DataTypes.DATEONLY,
            comment: '严管起日'
        },
        end_date: {
            type: DataTypes.DATEONLY,
            comment: '严管止日'
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: '待审核',
            comment: '业务状态'
        },
        // 派驻单位（数据隔离）
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '派驻监所名称'
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
        tableName: 'strict_educations',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['prisoner_id'] },
            { fields: ['create_date'] },
            { fields: ['prison_name'] },
            { fields: ['sync_batch'] }
        ]
    })

    return StrictEducation
}
