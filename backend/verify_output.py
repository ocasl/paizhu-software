from docx import Document
import os

path = r"e:\CODE\paizhu-software\backend\test_output.docx"

if not os.path.exists(path):
    print("Error: test_output.docx not found!")
    exit(1)

doc = Document(path)

expected_values = {
    "PrisonName": "测试监狱",
    "Inspector": "测试检察官",
    "EquipCount": "888",
    "GangCount": "333",
    "Location": "一监区车间",
    "Supervision": "发现一处安全隐患",
    "StrictTotal": "3" # 2+1
}

found_flags = {k: False for k in expected_values}

print("--- Scanning Document Content ---")
row_idx = 0
for table in doc.tables:
    for row in table.rows:
        row_text = []
        for cell in row.cells:
            text = cell.text.strip()
            row_text.append(text)
            
            for k, val in expected_values.items():
                if val in text:
                    found_flags[k] = True
                    # Optimization: Don't break, might contain multiple
        
        print(f"Row {row_idx}: {row_text}")
        row_idx += 1

print("\n--- Results ---")
all_passed = True
for k, val in expected_values.items():
    if found_flags[k]:
        print(f"[PASS] Found {k}: {val}")
    else:
        print(f"[FAIL] Missing {k}: {val}")
        all_passed = False

if all_passed:
    print("\nSUCCESS: All data injected correctly!")
else:
    print("\nFAILURE: Some data is missing. Template tagging might be broken.")
