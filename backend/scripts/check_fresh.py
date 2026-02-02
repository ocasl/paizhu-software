# -*- coding: utf-8 -*-
from docx import Document

path = r"e:\CODE\paizhu-software\backend\muban\template_fresh.docx"

print(f"处理文件: {path}")

doc = Document(path)

print("=== 正在检查模板内容 ===")

# 先检查内容
for t_idx, table in enumerate(doc.tables):
    print(f"\n--- Table {t_idx} ---")
    for r_idx, row in enumerate(table.rows):
        cells = []
        for c_idx, cell in enumerate(row.cells):
            text = cell.text.strip().replace('\n', '|')[:30]
            cells.append(f"[{text}]")
        print(f"Row {r_idx}: {' '.join(cells)}")
