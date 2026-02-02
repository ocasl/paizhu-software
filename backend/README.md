# 派驻检察软件后端

## 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env` 并修改数据库配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下配置：
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=paizhu_db
DB_USER=root
DB_PASSWORD=你的MySQL密码
```

### 3. 创建数据库
在 MySQL 中创建数据库：
```sql
CREATE DATABASE paizhu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务器
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 http://localhost:3000 启动。

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/profile` | 获取当前用户信息 |
| PUT | `/api/auth/password` | 修改密码 |

### 日检察
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/daily-logs` | 获取列表 |
| POST | `/api/daily-logs` | 创建记录 |
| GET | `/api/daily-logs/:id` | 获取详情 |
| PUT | `/api/daily-logs/:id` | 更新记录 |
| DELETE | `/api/daily-logs/:id` | 删除记录 |

### 附件上传
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/attachments/upload` | 上传单个文件 |
| POST | `/api/attachments/upload-multiple` | 批量上传 |
| GET | `/api/attachments` | 获取附件列表 |
| GET | `/api/attachments/:id/download` | 下载附件 |

### 报告
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reports/monthly` | 获取月度报告数据 |
| GET | `/api/reports/checklist` | 获取事项清单 |

## 目录结构
```
backend/
├── app.js              # 应用入口
├── config/
│   └── database.js     # 数据库配置
├── middleware/
│   └── auth.js         # JWT认证中间件
├── models/             # 数据模型
│   ├── index.js
│   ├── User.js
│   ├── DailyLog.js
│   └── ...
├── routes/             # API路由
│   ├── auth.js
│   ├── dailyLogs.js
│   └── ...
└── uploads/            # 文件上传目录
```
