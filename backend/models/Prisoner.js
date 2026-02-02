/**
 * 罪犯基本信息模型
 * 用于存储从模板导入的罪犯基础数据
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Prisoner = sequelize.define('Prisoner', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // 罪犯编号 - 唯一标识
        prisoner_id: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            comment: '罪犯编号，如 1000000001'
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '罪犯姓名'
        },
        gender: {
            type: DataTypes.STRING(10),
            comment: '性别'
        },
        birth_date: {
            type: DataTypes.DATEONLY,
            comment: '出生日期'
        },
        ethnicity: {
            type: DataTypes.STRING(20),
            comment: '民族'
        },
        education: {
            type: DataTypes.STRING(50),
            comment: '文化程度'
        },
        sentence_type: {
            type: DataTypes.STRING(50),
            comment: '刑种，如有期徒刑、无期徒刑'
        },
        crime: {
            type: DataTypes.STRING(200),
            comment: '罪名'
        },
        original_term: {
            type: DataTypes.STRING(20),
            comment: '原判刑期，格式如 10_06_00'
        },
        term_start: {
            type: DataTypes.DATEONLY,
            comment: '刑期起日'
        },
        term_end: {
            type: DataTypes.DATEONLY,
            comment: '刑期止日'
        },
        prison_unit: {
            type: DataTypes.STRING(100),
            comment: '所属单位（监狱名称）'
        },
        prison_area: {
            type: DataTypes.STRING(50),
            comment: '所属监区'
        },
        native_place: {
            type: DataTypes.STRING(100),
            comment: '籍贯/国籍'
        },
        political_status: {
            type: DataTypes.STRING(50),
            comment: '捕前面貌'
        },
        admission_date: {
            type: DataTypes.DATEONLY,
            comment: '入监日期'
        }
    }, {
        tableName: 'prisoners',
        timestamps: true,
        underscored: true,
        indexes: [
            { unique: true, fields: ['prisoner_id'] },
            { fields: ['prison_unit'] },
            { fields: ['prison_area'] }
        ]
    })

    return Prisoner
}
