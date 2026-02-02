/**
 * 用户模型
 * 存储派驻人员信息
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: '用户名'
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '密码(加密)'
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '姓名'
        },
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '派驻监所名称'
        },
        role: {
            type: DataTypes.ENUM('admin', 'inspector', 'leader'),
            defaultValue: 'inspector',
            comment: '角色: admin-管理员, inspector-检察员, leader-领导'
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
            comment: '联系电话'
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            comment: '账号状态'
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '最后登录时间'
        }
    }, {
        tableName: 'users',
        comment: '用户表',
        underscored: false, // 使用驼峰命名，不使用下划线
        timestamps: true // 启用时间戳字段
    })

    return User
}
