from docx import Document

# 检查原始的 .docx 文件，看看数字在哪里
path = r"e:\CODE\paizhu-software\backend\muban\派驻检察工作日志.docx"
doc = Document(path)

print("=== Inspecting 派驻检察工作日志.docx ===")
for t_idx, table in enumerate(doc.tables):
    print(f"\n--- Table {t_idx} ---")
    for r_idx, row in enumerate(table.rows):
        cells_text = []
        for c_idx, cell in enumerate(row.cells):
            text = cell.text.strip().replace('\n', '|')[:20]
            cells_text.append(f"[{text}]")
        print(f"Row {r_idx}: {' '.join(cells_text)}")
