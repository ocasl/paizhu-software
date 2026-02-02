#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析事项清单模板的XML结构
找到表格中的检察情况列，以便正确替换内容
"""

import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

# Word XML命名空间
namespaces = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
}

def analyze_template():
    template_path = Path(__file__).parent.parent / 'muban' / '派驻检察工作报告事项清单_modified.docx'
    
    print(f'分析模板: {template_path}')
    print('=' * 80)
    
    with zipfile.ZipFile(template_path, 'r') as docx:
        # 读取document.xml
        xml_content = docx.read('word/document.xml')
        
        # 解析XML
        root = ET.fromstring(xml_content)
        
        # 查找所有表格
        tables = root.findall('.//w:tbl', namespaces)
        print(f'\n找到 {len(tables)} 个表格\n')
        
        for table_idx, table in enumerate(tables):
            print(f'表格 {table_idx + 1}:')
            print('-' * 80)
            
            # 查找所有行
            rows = table.findall('.//w:tr', namespaces)
            print(f'  行数: {len(rows)}')
            
            # 分析前3行（表头+前2个数据行）
            for row_idx, row in enumerate(rows[:5]):
                print(f'\n  行 {row_idx + 1}:')
                
                # 查找所有单元格
                cells = row.findall('.//w:tc', namespaces)
                print(f'    单元格数: {len(cells)}')
                
                for cell_idx, cell in enumerate(cells):
                    # 获取单元格文本
                    texts = cell.findall('.//w:t', namespaces)
                    cell_text = ''.join([t.text or '' for t in texts])
                    print(f'      单元格 {cell_idx + 1}: "{cell_text}"')
            
            print()

if __name__ == '__main__':
    analyze_template()
