# Python 解析器安装说明

## 用途
Python 脚本用于解析犯情动态 Word 文档，作为 Node.js 的工具使用（不是独立服务）

## 安装步骤

### 1. 确保已安装 Python 3
```bash
python --version
# 或
python3 --version
```

### 2. 安装依赖包
```bash
cd backend/utils
pip install -r requirements.txt
# 或
pip3 install -r requirements.txt
```

### 3. 测试 Python 脚本
```bash
python parse_criminal_report.py "../../muban/XX省XX监狱2025年某月犯情动态.docx"
```

应该输出 JSON 格式的解析结果

## 工作原理

1. Node.js 接收 Word 文档上传
2. Node.js 调用 Python 脚本：`python parse_criminal_report.py file.docx`
3. Python 解析文档，输出 JSON 到 stdout
4. Node.js 读取 JSON，保存到数据库

## 优点

- Python 不对外暴露，只是内部工具
- 不需要登录、鉴权、数据库连接
- 不需要独立的 Python 服务器
- 就像调用 ffmpeg 一样简单

## 故障排查

### 问题：找不到 python 命令
**解决**：确保 Python 已添加到系统 PATH，或修改 Node.js 代码使用完整路径

### 问题：找不到 docx 模块
**解决**：运行 `pip install python-docx`

### 问题：中文乱码
**解决**：确保文件编码为 UTF-8，Python 脚本已设置 `# -*- coding: utf-8 -*-`
