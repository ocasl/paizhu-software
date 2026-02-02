/**
 * 附件模型
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Attachment = sequelize.define('Attachment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '上传用户ID'
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '分类'
        },
        original_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '原文件名'
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '存储文件名'
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '文件存储路径'
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '文件大小(字节)'
        },
        mime_type: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'MIME类型'
        },
        // 解析后的数据（用于花名册等）
        parsed_data: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '解析后的数据'
        },
        upload_month: {
            type: DataTypes.STRING(7),
            allowNull: true,
            comment: '上传月份 YYYY-MM'
        },
        // 关联的检察记录
        related_log_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '关联的检察记录ID'
        },
        related_log_type: {
            type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'immediate'),
            allowNull: true,
            comment: '检察记录类型'
        }
    }, {
        tableName: 'attachments',
        comment: '附件表',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['category'] },
            { fields: ['upload_month'] },
            { fields: ['related_log_id'] },
            { fields: ['related_log_type'] },
            { fields: ['related_log_id', 'related_log_type'] }
        ]
    })

    return Attachment
}
