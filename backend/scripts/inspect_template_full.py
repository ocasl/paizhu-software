from docx import Document
import os

path = r"e:\CODE\paizhu-software\backend\muban\派驻检察工作日志.docx"
doc = Document(path)

for t_idx, table in enumerate(doc.tables):
    print(f"--- Table {t_idx} ---")
    for r_idx, row in enumerate(table.rows):
        cells = []
        for c_idx, cell in enumerate(row.cells):
            # Show simplified text
            txt = cell.text.strip().replace("\n", "|")
            if len(txt) > 20: txt = txt[:17] + "..."
            cells.append(f"({r_idx},{c_idx})[{txt}]")
        print(" ".join(cells))
