"""
模板同步 API 测试脚本
使用 Python 生成测试用的 Excel 文件并上传测试各个接口
"""
import os
import requests
import pandas as pd
from datetime import datetime, timedelta
import random

API_BASE = 'http://localhost:3000/api'
TEST_DIR = os.path.join(os.path.dirname(__file__), 'test_templates')

# 确保测试目录存在
os.makedirs(TEST_DIR, exist_ok=True)

# 登录获取token
def get_token():
    """尝试登录获取认证token"""
    passwords = ['admin123', '123456', 'admin']
    for pwd in passwords:
        try:
            resp = requests.post(f'{API_BASE}/auth/login', json={
                'username': 'admin',
                'password': pwd
            })
            if resp.status_code == 200:
                print(f'✅ 登录成功')
                return resp.json().get('token')
        except:
            pass
    print('❌ 登录失败，请检查管理员账号密码')
    return None

# 生成严管教育审批测试数据
def create_strict_education_xlsx():
    """生成严管教育审批测试Excel"""
    data = {
        '制单时间': ['2025-01-15', '2025-01-16', '2025-01-17'],
        '所属单位': ['测试监狱', '测试监狱', '测试监狱'],
        '所属监区': ['一监区', '二监区', '三监区'],
        '罪犯姓名': ['张测试', '李测试', '王测试'],
        '罪犯编号': ['TEST0001', 'TEST0002', 'TEST0003'],
        '性别': ['男', '男', '女'],
        '出生日期': ['1990-01-01', '1985-06-15', '1992-03-20'],
        '民族': ['汉族', '回族', '汉族'],
        '文化程度': ['大学', '高中', '初中'],
        '刑种': ['有期徒刑', '有期徒刑', '无期徒刑'],
        '罪名': ['盗窃罪', '故意伤害罪', '诈骗罪'],
        '原判刑期': ['05_00_00', '03_06_00', '无期'],
        '刑期起日': ['2023-01-01', '2024-01-01', '2022-06-01'],
        '现刑期止日': ['2028-01-01', '2027-07-01', ''],
        '适用条款': ['第七条第三款', '第七条第一款', '第七条第二款'],
        '严管教育原因': ['违反监规', '与他人发生冲突', '拒绝劳动'],
        '严管天数': [30, 15, 45],
        '严管起日': ['2025-01-15', '2025-01-16', '2025-01-17'],
        '严管止日': ['2025-02-14', '2025-01-31', '2025-03-03'],
        '业务状态': ['已审核', '待审核', '已审核']
    }
    df = pd.DataFrame(data)
    filepath = os.path.join(TEST_DIR, '严管教育审批_测试.xlsx')
    df.to_excel(filepath, index=False)
    print(f'✅ 生成: {filepath}')
    return filepath

# 生成禁闭审批测试数据
def create_confinement_xlsx():
    """生成禁闭审批测试Excel"""
    data = {
        '制单时间': ['2025-01-10', '2025-01-12'],
        '所属单位': ['测试监狱', '测试监狱'],
        '所属监区': ['四监区', '五监区'],
        '罪犯姓名': ['赵测试', '钱测试'],
        '罪犯编号': ['TEST0004', 'TEST0005'],
        '性别': ['男', '男'],
        '出生日期': ['1988-08-08', '1995-12-25'],
        '民族': ['汉族', '满族'],
        '文化程度': ['本科', '大专'],
        '刑种': ['有期徒刑', '有期徒刑'],
        '罪名': ['抢劫罪', '贩毒罪'],
        '原判刑期': ['10_00_00', '08_00_00'],
        '现刑期起日': ['2020-01-01', '2021-06-01'],
        '现刑期止日': ['2030-01-01', '2029-06-01'],
        '禁闭起日': ['2025-01-10', '2025-01-12'],
        '禁闭止日': ['2025-01-17', '2025-01-19'],
        '适用条款': ['第四条第三款', '第四条第五款'],
        '违规事实': ['打架斗殴', '私藏违禁品'],
        '业务状态': ['已审核', '已审核']
    }
    df = pd.DataFrame(data)
    filepath = os.path.join(TEST_DIR, '禁闭审批_测试.xlsx')
    df.to_excel(filepath, index=False)
    print(f'✅ 生成: {filepath}')
    return filepath

# 生成涉黑恶名单测试数据
def create_blacklist_xlsx():
    """生成涉黑恶名单测试Excel"""
    # 第一行是标题
    data = {
        '序号': [1, 2, 3, 4],
        '罪犯编号': ['TEST0006', 'TEST0007', 'TEST0008', 'TEST0009'],
        '姓名': ['孙测试', '周测试', '吴测试', '郑测试'],
        '性别': ['男', '男', '女', '男'],
        '民族': ['汉族', '汉族', '苗族', '汉族'],
        '出生日期': ['1982.05.10', '1979.11.22', '1990.07.18', '1985.09.03'],
        '籍贯/国籍': ['四川省成都市', '广东省深圳市', '贵州省贵阳市', '江苏省南京市'],
        '捕前面貌': ['群众', '群众', '团员', '党员'],
        '原判罪名': ['组织黑社会罪', '敲诈勒索罪', '开设赌场罪', '寻衅滋事罪'],
        '原判刑期': ['15_00_00', '08_00_00', '05_00_00', '03_00_00'],
        '原判刑期起日': ['2018.01.01', '2020.06.01', '2022.03.01', '2023.01.01'],
        '原判刑期止日': ['2033.01.01', '2028.06.01', '2027.03.01', '2026.01.01'],
        '入监日期': ['2018.02.15', '2020.07.20', '2022.04.10', '2023.02.28'],
        '三涉情况': ['涉黑', '涉恶', '涉恶', '涉恶'],
        '在押现状': ['在押', '在押', '在押', '在押'],
        '刑罚变动情况': ['', '减刑6个月', '', '']
    }
    df = pd.DataFrame(data)
    filepath = os.path.join(TEST_DIR, '涉黑恶名单_测试.xlsx')
    # 添加标题行
    with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
        # 先写标题
        title_df = pd.DataFrame([['测试监狱涉黑恶人员名单'] + [''] * (len(data) - 1)])
        title_df.to_excel(writer, index=False, header=False, startrow=0)
        # 再写数据
        df.to_excel(writer, index=False, startrow=1)
    print(f'✅ 生成: {filepath}')
    return filepath

# 生成戒具使用审批测试数据
def create_restraint_xlsx():
    """生成戒具使用审批测试Excel"""
    data = {
        '制单时间': ['2025-01-08', '2025-01-09', '2025-01-10'],
        '所属单位': ['测试监狱', '测试监狱', '测试监狱'],
        '所属监区': ['六监区', '七监区', '八监区'],
        '姓名': ['冯测试', '陈测试', '褚测试'],
        '罪犯编号': ['TEST0010', 'TEST0011', 'TEST0012'],
        '使用警戒具名称': ['手铐', '脚镣', '约束带'],
        '使用条款': ['第三条第一款', '第三条第二款', '第三条第三款'],
        '加戴戒具天数': [7, 5, 3],
        '使用起日': ['2025-01-08', '2025-01-09', '2025-01-10'],
        '使用止日': ['2025-01-15', '2025-01-14', '2025-01-13'],
        '业务状态': ['已审核', '已审核', '待审核']
    }
    df = pd.DataFrame(data)
    filepath = os.path.join(TEST_DIR, '戒具使用审批_测试.xlsx')
    df.to_excel(filepath, index=False)
    print(f'✅ 生成: {filepath}')
    return filepath

# 生成信件汇总测试数据
def create_mail_xlsx():
    """生成信件汇总测试Excel"""
    data = {
        '序号': list(range(1, 11)),
        '开箱日期': ['2025-01-05'] * 5 + ['2025-01-12'] * 5,
        '监区': ['一监区', '二监区', '三监区', '四监区', '五监区'] * 2,
        '罪犯名字': ['测试甲', '测试乙', '测试丙', '测试丁', '测试戊',
                    '测试己', '测试庚', '测试辛', '测试壬', '测试癸'],
        '事由': ['家属来信', '朋友来信', '律师来信', '申诉材料', '家属来信',
                '法院通知', '家属来信', '朋友来信', '申诉材料', '家属来信'],
        '类别': ['普通信件', '普通信件', '法律文书', '法律文书', '普通信件',
                '法律文书', '普通信件', '普通信件', '法律文书', '普通信件'],
        '备注': ['', '需核实', '', '', '已转交', '', '', '退回', '', '']
    }
    df = pd.DataFrame(data)
    filepath = os.path.join(TEST_DIR, '信件汇总_测试.xlsx')
    df.to_excel(filepath, index=False)
    print(f'✅ 生成: {filepath}')
    return filepath

# 上传文件测试
def test_upload(endpoint, filepath, name, token):
    """测试上传接口"""
    print(f'\n{"="*60}')
    print(f'测试: {name}')
    print(f'文件: {os.path.basename(filepath)}')
    print(f'接口: POST {endpoint}')
    print('='*60)
    
    if not os.path.exists(filepath):
        print(f'❌ 文件不存在')
        return None
    
    try:
        with open(filepath, 'rb') as f:
            files = {'file': (os.path.basename(filepath), f)}
            headers = {'Authorization': f'Bearer {token}'} if token else {}
            resp = requests.post(f'{API_BASE}{endpoint}', files=files, headers=headers)
        
        if resp.status_code == 200:
            result = resp.json()
            print('✅ 上传成功!')
            print(f"   类型: {result.get('typeName', result.get('type'))}")
            print(f"   总记录: {result.get('stats', {}).get('total', 0)}")
            print(f"   新增: {result.get('stats', {}).get('inserted', 0)}")
            print(f"   更新: {result.get('stats', {}).get('updated', 0)}")
            print(f"   错误: {result.get('stats', {}).get('errors', 0)}")
            if result.get('errorDetails'):
                print(f"   错误详情: {result['errorDetails'][:3]}")
            return result
        else:
            print(f'❌ 上传失败: {resp.status_code}')
            print(f'   错误: {resp.text[:200]}')
            return None
    except Exception as e:
        print(f'❌ 请求出错: {e}')
        return None

# 获取统计
def get_stats(token):
    """获取统计数据"""
    print(f'\n{"="*60}')
    print('📊 获取统计数据')
    print('='*60)
    
    try:
        headers = {'Authorization': f'Bearer {token}'} if token else {}
        resp = requests.get(f'{API_BASE}/template-sync/stats', headers=headers)
        
        if resp.status_code == 200:
            stats = resp.json()
            print('✅ 统计数据:')
            print(f'   罪犯信息: {stats.get("prisoners", 0)}')
            print(f'   严管教育: {stats.get("strictEducation", 0)}')
            print(f'   禁闭记录: {stats.get("confinement", 0)}')
            print(f'   戒具使用: {stats.get("restraint", 0)}')
            print(f'   信件记录: {stats.get("mail", 0)}')
            print(f'   涉黑恶名单: {stats.get("blacklist", 0)}')
            print(f'   总计: {stats.get("total", 0)}')
            return stats
        else:
            print(f'❌ 获取失败: {resp.status_code}')
            return None
    except Exception as e:
        print(f'❌ 请求出错: {e}')
        return None

# 主测试
def main():
    print('\n🚀 模板同步 API 测试')
    print('='*60)
    
    # 1. 生成测试文件
    print('\n📝 生成测试Excel文件...')
    files = {
        'strict-education': create_strict_education_xlsx(),
        'confinement': create_confinement_xlsx(),
        'blacklist': create_blacklist_xlsx(),
        'restraint': create_restraint_xlsx(),
        'mail': create_mail_xlsx()
    }
    
    # 2. 登录获取token
    print('\n🔐 登录获取认证...')
    token = get_token()
    
    # 3. 测试各接口
    tests = [
        ('/template-sync/strict-education', files['strict-education'], '严管教育审批'),
        ('/template-sync/confinement', files['confinement'], '禁闭审批'),
        ('/template-sync/blacklist', files['blacklist'], '涉黑恶名单'),
        ('/template-sync/restraint', files['restraint'], '戒具使用审批'),
        ('/template-sync/mail', files['mail'], '信件汇总'),
    ]
    
    results = []
    for endpoint, filepath, name in tests:
        result = test_upload(endpoint, filepath, name, token)
        results.append((name, result is not None, result))
    
    # 4. 获取更新后的统计
    get_stats(token)
    
    # 5. 汇总
    print(f'\n{"="*60}')
    print('📋 测试结果汇总')
    print('='*60)
    
    passed = failed = 0
    for name, success, result in results:
        if success:
            stats = result.get('stats', {})
            print(f'✅ {name}: 成功 (+{stats.get("inserted", 0)}/↻{stats.get("updated", 0)})')
            passed += 1
        else:
            print(f'❌ {name}: 失败')
            failed += 1
    
    print('-'*60)
    print(f'通过: {passed}/{len(results)}')
    print('='*60)

if __name__ == '__main__':
    main()
