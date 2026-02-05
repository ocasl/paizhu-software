# 达梦数据库安装指南

## 1. 安装达梦数据库

1. 下载达梦数据库 DM8 安装包
2. 运行安装程序，选择"典型安装"
3. 设置数据库实例名：PAIZHU
4. 设置管理员密码（SYSDBA）
5. 完成安装

## 2. 创建数据库用户

```sql
-- 使用 SYSDBA 登录
CREATE USER paizhu_user IDENTIFIED BY "your_password";
GRANT DBA TO paizhu_user;
```

## 3. 执行建表脚本

```bash
# 使用 disql 命令行工具
disql paizhu_user/your_password@localhost:5236

# 执行脚本
START paizhu_db_dm8_v2.sql;
```

## 4. 验证安装

```sql
-- 查看所有表
SELECT TABLE_NAME FROM USER_TABLES;

-- 查看所有序列
SELECT SEQUENCE_NAME FROM USER_SEQUENCES;

-- 查看表数量
SELECT COUNT(*) FROM USER_TABLES;
```

## 5. 配置 Node.js 连接

```bash
# 安装达梦驱动
npm install dmdb --save
```

```javascript
// backend/config/database.js
const { Sequelize } = require("sequelize")

const sequelize = new Sequelize({
  dialect: "postgres",  // 使用 postgres 方言
  dialectModule: require("dmdb"),  // 使用达梦驱动
  host: "localhost",
  port: 5236,
  database: "PAIZHU",
  username: "paizhu_user",
  password: "your_password",
  logging: console.log
})
```

## 6. 数据迁移

```bash
# 从 MySQL 导出数据
mysqldump -u root -p --no-create-info paizhu_db > data.sql

# 转换并导入到达梦
# 需要手动调整 INSERT 语句中的语法差异
```

## 7. 常见问题

### Q: 序列如何使用？
A: 使用 `SEQUENCE_NAME.NEXTVAL` 获取下一个值

### Q: JSON 字段如何处理？
A: 已转换为 TEXT，需要在应用层序列化/反序列化

### Q: ENUM 字段如何处理？
A: 已转换为 VARCHAR + CHECK 约束

### Q: 如何回滚到 MySQL？
A: 修改 .env 文件中的 DB_TYPE=mysql，重启服务
