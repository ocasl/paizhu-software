/**
 * 执行数据库迁移脚本
 * 用法：node scripts/run-migration.js
 */
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// 读取数据库配置
const config = require('../config/database.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建数据库连接
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: console.log
    }
);

async function runMigration() {
    try {
        console.log('🔄 开始执行数据库迁移...\n');
        
        // 测试连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功\n');
        
        // 步骤1：为 weekly_records 添加字段
        console.log('📝 步骤1：为 weekly_records 表添加字段...');
        try {
            await sequelize.query(`
                ALTER TABLE weekly_records 
                ADD COLUMN log_id INT DEFAULT NULL COMMENT '关联的日志ID',
                ADD COLUMN log_date DATE DEFAULT NULL COMMENT '关联的日志日期'
            `);
            console.log('✅ weekly_records 字段添加成功\n');
        } catch (error) {
            if (error.message.includes('Duplicate column')) {
                console.log('⚠️  字段已存在，跳过\n');
            } else {
                throw error;
            }
        }
        
        // 步骤2：为 monthly_records 添加字段
        console.log('📝 步骤2：为 monthly_records 表添加字段...');
        try {
            await sequelize.query(`
                ALTER TABLE monthly_records 
                ADD COLUMN log_id INT DEFAULT NULL COMMENT '关联的日志ID',
                ADD COLUMN log_date DATE DEFAULT NULL COMMENT '关联的日志日期'
            `);
            console.log('✅ monthly_records 字段添加成功\n');
        } catch (error) {
            if (error.message.includes('Duplicate column')) {
                console.log('⚠️  字段已存在，跳过\n');
            } else {
                throw error;
            }
        }
        
        // 步骤3：创建索引
        console.log('📝 步骤3：创建索引...');
        
        const indexes = [
            { table: 'weekly_records', column: 'log_id', name: 'idx_weekly_records_log_id' },
            { table: 'weekly_records', column: 'log_date', name: 'idx_weekly_records_log_date' },
            { table: 'monthly_records', column: 'log_id', name: 'idx_monthly_records_log_id' },
            { table: 'monthly_records', column: 'log_date', name: 'idx_monthly_records_log_date' }
        ];
        
        for (const index of indexes) {
            try {
                await sequelize.query(`CREATE INDEX ${index.name} ON ${index.table}(${index.column})`);
                console.log(`✅ 索引 ${index.name} 创建成功`);
            } catch (error) {
                if (error.message.includes('Duplicate key')) {
                    console.log(`⚠️  索引 ${index.name} 已存在，跳过`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('\n🎉 数据库迁移完成！\n');
        console.log('已添加的字段：');
        console.log('  - weekly_records.log_id');
        console.log('  - weekly_records.log_date');
        console.log('  - monthly_records.log_id');
        console.log('  - monthly_records.log_date');
        console.log('\n已创建的索引：');
        console.log('  - idx_weekly_records_log_id');
        console.log('  - idx_weekly_records_log_date');
        console.log('  - idx_monthly_records_log_id');
        console.log('  - idx_monthly_records_log_date');
        
    } catch (error) {
        console.error('\n❌ 迁移失败:', error.message);
        console.error('\n详细错误信息：');
        console.error(error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// 执行迁移
runMigration();
