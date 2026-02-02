/**
 * 用户监狱范围模型
 * 定义分管领导可以查看/审核的监狱范围
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const UserPrisonScope = sequelize.define('UserPrisonScope', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '用户ID',
            references: {
                model: 'users',
                key: 'id'
            }
        },
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '监狱名称'
        }
    }, {
        tableName: 'user_prison_scopes',
        comment: '用户监狱范围表',
        timestamps: true,
        underscored: false,  // 使用驼峰命名 createdAt/updatedAt
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['prison_name']
            },
            {
                unique: true,
                fields: ['user_id', 'prison_name']
            }
        ]
    })

    return UserPrisonScope
}
