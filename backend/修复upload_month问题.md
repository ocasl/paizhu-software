# 修复 Excel 数据表 upload_month 字段问题

## 问题描述

Excel 数据上传时，`upload_month` 字段一直保存为 `null`，导致数据无法正确按月份查询和统计。

## 根本原因

1. **模型定义缺失**：5个Excel数据模型（StrictEducation、Confinement、Blacklist、RestraintUsage、MailRecord）中都没有定义 `upload_month` 字段
2. **数据库表缺失字段**：数据库表中可能也没有 `upload_month` 字段

## 修复步骤

### 步骤1：检查数据库字段是否存在

```bash
cd backend
node check_upload_month_field.js
```

如果显示"❌ upload_month 字段不存在"，继续步骤2。

### 步骤2：添加数据库字段

**方法A：使用批处理文件（推荐）**
```bash
cd backend
修复Excel表字段.bat
```

**方法B：手动执行SQL**
```bash
mysql -u root -p < backend/add_upload_month.sql
```

### 步骤3：验证模型定义

已修复的模型文件：
- ✅ `backend/models/StrictEducation.js`
- ✅ `backend/models/Confinement.js`
- ✅ `backend/models/Blacklist.js`
- ✅ `backend/models/RestraintUsage.js`
- ✅ `backend/models/MailRecord.js`

所有模型都已添加：
```javascript
upload_month: {
    type: DataTypes.STRING(7),
    comment: '数据归属月份 (YYYY-MM)'
}
```

### 步骤4：清空旧数据（可选）

如果需要清空之前上传的测试数据：
```bash
cd backend
node clear_excel_data.js
```

### 步骤5：重启服务

```bash
cd ..
restart-all.bat
```

### 步骤6：重新测试上传

1. 登录系统（派驻检察官账号）
2. 选择"数据归属月份"（如：2026-02）
3. 上传Excel文件（严管教育、禁闭、涉黑恶、戒具、信件）
4. 检查后端日志，应该看到：
   ```
   📤 上传严管教育数据: { prisonName: '女子监狱', uploadMonth: '2026-02' }
   ✅ 已同步更新 monthly_basic_info: 记过 X 人
   ```

### 步骤7：验证数据

```bash
cd backend
node check_data_2026_02.js
```

应该看到：
- ✅ 找到严管教育数据（X条）
- ✅ 找到禁闭数据（X条）
- ✅ 找到涉黑恶数据（X条）
- ✅ 找到戒具使用数据（X条）
- ✅ 找到信件数据（X条）

## 涉及的文件

### 模型文件（已修复）
- `backend/models/StrictEducation.js`
- `backend/models/Confinement.js`
- `backend/models/Blacklist.js`
- `backend/models/RestraintUsage.js`
- `backend/models/MailRecord.js`

### SQL脚本
- `backend/add_upload_month.sql` - 添加字段的SQL脚本
- `backend/add_upload_month_to_excel_tables.sql` - 新版SQL脚本（带索引）

### 批处理文件
- `backend/修复Excel表字段.bat` - 执行SQL脚本

### 检查脚本
- `backend/check_upload_month_field.js` - 检查字段是否存在
- `backend/check_data_2026_02.js` - 验证数据是否正确保存

### 路由文件
- `backend/routes/templateSync.js` - Excel上传和同步逻辑

## 数据流程

```
前端选择月份 (2026-02)
    ↓
上传Excel文件
    ↓
templateSync.js 接收 upload_month 参数
    ↓
syncRecords() 函数保存数据
    ↓
Model.create({ ...record, upload_month: '2026-02' })
    ↓
数据库表保存 upload_month 字段
    ↓
同步更新 monthly_basic_info 表
    ↓
报告预览和清单可以查询到数据
```

## 注意事项

1. **数据归属月份**：使用前端选择的月份，不是Excel中的日期
2. **派驻单位**：使用当前用户的 `prison_name`
3. **数据隔离**：所有查询都必须带 `prison_name` + `upload_month` 条件
4. **直接覆盖**：同一监狱同一月份的数据，后上传的覆盖先上传的

## 测试清单

- [ ] 数据库字段已添加
- [ ] 模型定义已更新
- [ ] 服务已重启
- [ ] 上传严管教育Excel - upload_month 不为 null
- [ ] 上传禁闭审批Excel - upload_month 不为 null
- [ ] 上传涉黑恶名单Excel - upload_month 不为 null
- [ ] 上传戒具使用Excel - upload_month 不为 null
- [ ] 上传信件汇总Excel - upload_month 不为 null
- [ ] monthly_basic_info 表数据已同步
- [ ] 报告预览可以看到数据
- [ ] 清单可以看到数据

## 完成标志

当你看到以下日志时，说明修复成功：

```
📤 上传严管教育数据: { prisonName: '女子监狱', uploadMonth: '2026-02' }
✅ 已同步更新 monthly_basic_info: 记过 5 人

【strict_educations 表】
✅ 找到严管教育数据: 5 条
  upload_month: 2026-02 ✓
```
