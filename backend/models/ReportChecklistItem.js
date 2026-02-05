const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ReportChecklistItem = sequelize.define('ReportChecklistItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    prison_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '监狱名称'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '年份'
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '月份'
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '清单项目ID (1-16)'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '报告内容'
    },
    situation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '检察情况'
    },
    check_time: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '记录时间'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'createdAt'  // 明确指定数据库字段名
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updatedAt'  // 明确指定数据库字段名
    }
  }, {
    tableName: 'report_checklist_items',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        unique: true,
        fields: ['prison_name', 'year', 'month', 'item_id']
      }
    ]
  })

  return ReportChecklistItem
}
