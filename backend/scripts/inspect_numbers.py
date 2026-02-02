from docx import Document

path = r"e:\CODE\paizhu-software\backend\muban\派驻检察工作日志_clean.docx"
doc = Document(path)

print("=== Inspecting Tables ===")
for t_idx, table in enumerate(doc.tables):
    print(f"\n--- Table {t_idx} ---")
    for r_idx, row in enumerate(table.rows):
        for c_idx, cell in enumerate(row.cells):
            text = cell.text.strip()
            if text:
                # 检查是否包含数字
                if any(str(n) in text for n in range(1, 13)):
                    print(f"  ({r_idx},{c_idx}): '{text[:50]}...' " if len(text) > 50 else f"  ({r_idx},{c_idx}): '{text}'")
