"""
提取犯情动态文档中的关键字段和数据
"""
from docx import Document
import re
import json

def extract_prisoner_data(file_path):
    """提取罪犯数据字段"""
    doc = Document(file_path)
    
    # 从表格提取数据
    data_fields = {}
    
    for table in doc.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            # 查找包含人数的单元格
            for cell_text in cells:
                # 匹配模式: xxx人 或 xxx名
                matches = re.findall(r'([\u4e00-\u9fa5]+)[：:]\s*(\d+)[人名]', cell_text)
                for field_name, count in matches:
                    data_fields[field_name] = int(count)
    
    return data_fields

if __name__ == '__main__':
    file_path = r"E:\CODE\paizhu-software\muban\XX省XX监狱2025年某月犯情动态.docx"
    
    try:
        data = extract_prisoner_data(file_path)
        
        print("提取到的罪犯数据字段:")
        print("=" * 60)
        for field, value in data.items():
            print(f"{field}: {value}")
        
        print(f"\n共提取 {len(data)} 个字段")
        
        # 保存到JSON
        output_file = "prisoner_fields.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"\n已保存到: {output_file}")
        
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
