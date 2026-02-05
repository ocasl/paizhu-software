#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
犯情动态Word文档解析器
作为Node.js的工具脚本使用，不是独立服务
用法: python parse_criminal_report.py <docx文件路径>
输出: JSON格式的解析结果
"""

import sys
import json
import re
from docx import Document

def extract_number(text, pattern):
    """提取数字，支持空格和千位分隔符（逗号）"""
    match = re.search(pattern, text)
    if match:
        # 移除空格、全角空格、逗号
        num_str = match.group(1).replace(' ', '').replace('\u3000', '').replace(',', '')
        try:
            return int(num_str)
        except:
            return None
    return None

def parse_criminal_report(docx_path):
    """解析犯情动态Word文档"""
    try:
        doc = Document(docx_path)
        
        # 提取所有文本
        full_text = '\n'.join([para.text for para in doc.paragraphs])
        
        result = {
            'success': True,
            'data': {
                # 监管安全
                'security': {
                    'hasEscape': False,
                    'hasMajorCase': False,
                    'hasSafetyAccident': False,
                    'hasHealthEvent': False,
                    'hasInternalCase': False,
                },
                
                # 违纪统计
                'discipline': {
                    'violationCount': None,
                    'confinementCount': None,
                    'warningCount': None,
                },
                
                # 罪犯构成（核心数据）
                'prisoners': {
                    'total': None,
                    'majorCriminal': None,
                    'deathSuspended': None,
                    'lifeSentence': None,
                    'multipleConvictions': None,
                    'foreign': None,
                    'hongKongMacaoTaiwan': None,
                    'mentalIllness': None,
                    'formerProvincial': None,
                    'formerCounty': None,
                    'falunGong': None,
                    'drugHistory': None,
                    'drugRelated': None,
                    'newlyAdmitted': None,
                    'juvenileFemale': None,
                    'gangRelated': None,
                    'evilRelated': None,
                    'dangerousSecurity': None,
                }
            }
        }
        
        data = result['data']
        
        # 1. 监管安全情况（反向判断）
        data['security']['hasEscape'] = '无罪犯脱逃' not in full_text
        data['security']['hasMajorCase'] = '无在全国全省有重大影响的狱内案件' not in full_text
        data['security']['hasSafetyAccident'] = '无重大安全生产事故' not in full_text
        data['security']['hasHealthEvent'] = '无重大公共卫生安全事件' not in full_text
        data['security']['hasInternalCase'] = '无狱内发案' not in full_text
        
        # 2. 违纪统计
        data['discipline']['violationCount'] = extract_number(full_text, r'(\d+)\s*名罪犯在担任')
        data['discipline']['confinementCount'] = extract_number(full_text, r'禁闭\s*([\d,]+)\s*人')
        data['discipline']['warningCount'] = extract_number(full_text, r'警告\s*([\d,]+)\s*人')
        
        # 3. 罪犯构成（核心数据）
        # 支持多种格式和千位分隔符：
        # - "在押罪犯1258人" 
        # - "在押罪犯 1258 人"
        # - "在押罪犯 1,258 人"
        # - "监狱在押罪犯1258人"
        # - "截至X月X日，监狱在押罪犯1258人"
        p = data['prisoners']
        p['total'] = extract_number(full_text, r'在押罪犯\s*([\d,]+)\s*人')
        if not p['total']:
            # 尝试其他格式
            p['total'] = extract_number(full_text, r'监狱.*?在押.*?([\d,]+)\s*人')
        
        p['majorCriminal'] = extract_number(full_text, r'重大刑事犯\s*([\d,]+)\s*名')
        p['deathSuspended'] = extract_number(full_text, r'死缓犯\s*([\d,]+)\s*名')
        p['lifeSentence'] = extract_number(full_text, r'无期犯\s*([\d,]+)\s*名')
        p['multipleConvictions'] = extract_number(full_text, r'二次以上判刑罪犯\s*([\d,]+)\s*名')
        p['foreign'] = extract_number(full_text, r'外籍犯\s*([\d,]+)\s*名')
        p['hongKongMacaoTaiwan'] = extract_number(full_text, r'含港澳台\s*([\d,]+)\s*名')
        if not p['hongKongMacaoTaiwan']:
            p['hongKongMacaoTaiwan'] = extract_number(full_text, r'港澳台\s*([\d,]+)\s*名')
        
        p['mentalIllness'] = extract_number(full_text, r'精神病犯\s*([\d,]+)\s*名')
        p['formerProvincial'] = extract_number(full_text, r'原地厅[级以上]*罪犯\s*([\d,]+)\s*名')
        p['formerCounty'] = extract_number(full_text, r'原县团级以上罪犯\s*([\d,]+)\s*名')
        p['falunGong'] = extract_number(full_text, r'"法轮功"[^0-9]*([\d,]+)\s*名')
        p['drugHistory'] = extract_number(full_text, r'有吸毒史罪犯\s*([\d,]+)\s*名')
        p['drugRelated'] = extract_number(full_text, r'涉毒犯\s*([\d,]+)\s*名')
        p['newlyAdmitted'] = extract_number(full_text, r'新收押罪犯\s*([\d,]+)\s*名')
        p['juvenileFemale'] = extract_number(full_text, r'未成年女犯\s*([\d,]+)\s*名')
        p['gangRelated'] = extract_number(full_text, r'涉黑罪犯\s*([\d,]+)\s*名')
        p['evilRelated'] = extract_number(full_text, r'涉恶罪犯\s*([\d,]+)\s*名')
        p['dangerousSecurity'] = extract_number(full_text, r'危安罪犯\s*([\d,]+)\s*名')
        
        return result
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': '请提供Word文档路径'
        }, ensure_ascii=False))
        sys.exit(1)
    
    docx_path = sys.argv[1]
    result = parse_criminal_report(docx_path)
    
    # 输出JSON到stdout，Node.js会读取
    print(json.dumps(result, ensure_ascii=False, indent=2))
