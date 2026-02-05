const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const CompilationCategory = sequelize.define('CompilationCategory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            comment: '分类名称'
        },
        description: {
            type: DataTypes.STRING(500),
            comment: '分类描述'
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '排序（数字越小越靠前）'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否启用'
        }
    }, {
        tableName: 'compilation_categories',
        timestamps: true,
        underscored: true,
        comment: '汇编分类表'
    })

    return CompilationCategory
}
