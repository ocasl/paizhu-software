const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const CompilationDocument = sequelize.define('CompilationDocument', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: '文档标题'
        },
        description: {
            type: DataTypes.TEXT,
            comment: '文档描述'
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '分类ID'
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '原始文件名'
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: '文件存储路径'
        },
        file_type: {
            type: DataTypes.ENUM('docx', 'pdf'),
            allowNull: false,
            comment: '文件类型'
        },
        file_size: {
            type: DataTypes.BIGINT,
            comment: '文件大小（字节）'
        },
        view_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '查看次数'
        },
        download_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '下载次数'
        },
        is_pinned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否置顶'
        },
        status: {
            type: DataTypes.ENUM('active', 'archived'),
            defaultValue: 'active',
            comment: '状态'
        }
    }, {
        tableName: 'compilation_documents',
        timestamps: true,
        underscored: true,
        comment: '汇编文档表'
    })

    return CompilationDocument
}
