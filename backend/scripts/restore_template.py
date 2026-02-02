import os
from docx import Document

BASE_DIR = r"e:\CODE\paizhu-software\backend\muban"
DOC_PATH = os.path.join(BASE_DIR, "派驻检察工作日志.docx")

def restore_headers():
    doc = Document(DOC_PATH)
    table = doc.tables[0]
    row0 = table.rows[0]
    
    # 强制恢复表头和标记
    # 注意：我们要确保只修改我们确定的单元格
    # 假设结构: [监所][val][人员][val][日期][val][填写][val]
    
    headers = {
        0: "派驻监所",
        1: "{派驻监所}",
        2: "派驻人员",
        3: "{派驻人员}",
        4: "日期",
        5: "{日期}",
        6: "填写人",
        7: "{填写人}"
    }
    
    for c_idx, text in headers.items():
        try:
            cell = row0.cells[c_idx]
            # 只有当内容看起来不对（比如是空的，或者被错误清理了）才修
            # 但为了保险，直接强制写入
            cell.text = text
            print(f"Restored (0, {c_idx}): {text}")
        except IndexError:
            print(f"IndexError at (0, {c_idx}) - Table might be smaller than expected")
        except Exception as e:
            print(f"Error at (0, {c_idx}): {e}")

    doc.save(DOC_PATH)
    print("Headers restored.")

if __name__ == "__main__":
    restore_headers()
