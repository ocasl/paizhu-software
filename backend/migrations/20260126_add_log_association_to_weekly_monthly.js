'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 添加字段到 weekly_records 表
    await queryInterface.addColumn('weekly_records', 'log_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '关联的日志ID'
    });

    await queryInterface.addColumn('weekly_records', 'log_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: '关联的日志日期'
    });

    // 添加字段到 monthly_records 表
    await queryInterface.addColumn('monthly_records', 'log_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '关联的日志ID'
    });

    await queryInterface.addColumn('monthly_records', 'log_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: '关联的日志日期'
    });

    // 添加索引以提高查询性能
    await queryInterface.addIndex('weekly_records', ['log_id'], {
      name: 'idx_weekly_records_log_id'
    });

    await queryInterface.addIndex('weekly_records', ['log_date'], {
      name: 'idx_weekly_records_log_date'
    });

    await queryInterface.addIndex('monthly_records', ['log_id'], {
      name: 'idx_monthly_records_log_id'
    });

    await queryInterface.addIndex('monthly_records', ['log_date'], {
      name: 'idx_monthly_records_log_date'
    });

    console.log('✓ 成功添加 log_id 和 log_date 字段到 weekly_records 和 monthly_records 表');
  },

  down: async (queryInterface, Sequelize) => {
    // 删除索引
    await queryInterface.removeIndex('weekly_records', 'idx_weekly_records_log_id');
    await queryInterface.removeIndex('weekly_records', 'idx_weekly_records_log_date');
    await queryInterface.removeIndex('monthly_records', 'idx_monthly_records_log_id');
    await queryInterface.removeIndex('monthly_records', 'idx_monthly_records_log_date');

    // 删除字段
    await queryInterface.removeColumn('weekly_records', 'log_id');
    await queryInterface.removeColumn('weekly_records', 'log_date');
    await queryInterface.removeColumn('monthly_records', 'log_id');
    await queryInterface.removeColumn('monthly_records', 'log_date');

    console.log('✓ 成功删除 log_id 和 log_date 字段');
  }
};
