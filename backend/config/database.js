/**
 * 数据库配置
 */
require('dotenv').config()

module.exports = {
    development: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || 'paizhu_db',
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        dialect: 'mysql',
        logging: console.log,
        timezone: '+08:00',
        define: {
            timestamps: true,
            underscored: true,  // 使用下划线命名
            freezeTableName: true
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    },
    production: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        dialect: 'mysql',
        logging: false,
        timezone: '+08:00',
        define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
        },
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        }
    }
}
