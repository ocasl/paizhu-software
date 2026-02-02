"""生成测试Excel并上传测试模板同步API"""
import os
import requests
import pandas as pd

API_BASE = 'http://localhost:3000/api'
TEST_DIR = 'test_templates'
os.makedirs(TEST_DIR, exist_ok=True)

# 登录
print('登录中...')
resp = requests.post(f'{API_BASE}/auth/login', json={'username': 'admin2', 'password': '123456'})
if resp.status_code == 200:
    token = resp.json().get('token')
    print('✅ 登录成功')
else:
    print(f'❌ 登录失败: {resp.text}')
    exit(1)

headers = {'Authorization': f'Bearer {token}'}

# 生成测试文件
print('\n生成测试Excel文件...')

# 1. 严管教育审批
data1 = {
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
pd.DataFrame(data1).to_excel(f'{TEST_DIR}/严管教育_测试.xlsx', index=False)
print('  ✅ 严管教育审批_测试.xlsx (3条)')

# 2. 禁闭审批
data2 = {
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
pd.DataFrame(data2).to_excel(f'{TEST_DIR}/禁闭审批_测试.xlsx', index=False)
print('  ✅ 禁闭审批_测试.xlsx (2条)')

# 3. 戒具使用
data3 = {
    '制单时间': ['2025-01-08', '2025-01-09'],
    '所属单位': ['测试监狱', '测试监狱'],
    '所属监区': ['六监区', '七监区'],
    '姓名': ['冯测试', '陈测试'],
    '罪犯编号': ['TEST0010', 'TEST0011'],
    '使用警戒具名称': ['手铐', '脚镣'],
    '使用条款': ['第三条第一款', '第三条第二款'],
    '加戴戒具天数': [7, 5],
    '使用起日': ['2025-01-08', '2025-01-09'],
    '使用止日': ['2025-01-15', '2025-01-14'],
    '业务状态': ['已审核', '已审核']
}
pd.DataFrame(data3).to_excel(f'{TEST_DIR}/戒具使用_测试.xlsx', index=False)
print('  ✅ 戒具使用审批_测试.xlsx (2条)')

# 4. 信件汇总
data4 = {
    '序号': [1, 2, 3, 4, 5],
    '开箱日期': ['2025-01-05', '2025-01-05', '2025-01-12', '2025-01-12', '2025-01-15'],
    '监区': ['一监区', '二监区', '三监区', '四监区', '五监区'],
    '罪犯名字': ['测试甲', '测试乙', '测试丙', '测试丁', '测试戊'],
    '事由': ['家属来信', '朋友来信', '律师来信', '申诉材料', '家属来信'],
    '类别': ['普通信件', '普通信件', '法律文书', '法律文书', '普通信件'],
    '备注': ['', '需核实', '', '', '已转交']
}
pd.DataFrame(data4).to_excel(f'{TEST_DIR}/信件汇总_测试.xlsx', index=False)
print('  ✅ 信件汇总_测试.xlsx (5条)')

# 5. 涉黑恶名单
data5 = {
    '序号': [1, 2, 3],
    '罪犯编号': ['TEST0006', 'TEST0007', 'TEST0008'],
    '姓名': ['孙测试', '周测试', '吴测试'],
    '性别': ['男', '男', '女'],
    '民族': ['汉族', '汉族', '苗族'],
    '出生日期': ['1982.05.10', '1979.11.22', '1990.07.18'],
    '籍贯/国籍': ['四川省成都市', '广东省深圳市', '贵州省贵阳市'],
    '捕前面貌': ['群众', '群众', '团员'],
    '原判罪名': ['组织黑社会罪', '敲诈勒索罪', '开设赌场罪'],
    '原判刑期': ['15_00_00', '08_00_00', '05_00_00'],
    '原判刑期起日': ['2018.01.01', '2020.06.01', '2022.03.01'],
    '原判刑期止日': ['2033.01.01', '2028.06.01', '2027.03.01'],
    '入监日期': ['2018.02.15', '2020.07.20', '2022.04.10'],
    '三涉情况': ['涉黑', '涉恶', '涉恶'],
    '在押现状': ['在押', '在押', '在押'],
    '刑罚变动情况': ['', '减刑6个月', '']
}
with pd.ExcelWriter(f'{TEST_DIR}/涉黑恶名单_测试.xlsx', engine='openpyxl') as w:
    pd.DataFrame([['测试监狱涉黑恶人员名单']]).to_excel(w, index=False, header=False, startrow=0)
    pd.DataFrame(data5).to_excel(w, index=False, startrow=1)
print('  ✅ 涉黑恶名单_测试.xlsx (3条)')

print('\n' + '='*60)
print('开始上传测试...')
print('='*60)

# 上传测试
tests = [
    ('/template-sync/strict-education', f'{TEST_DIR}/严管教育_测试.xlsx', '严管教育'),
    ('/template-sync/confinement', f'{TEST_DIR}/禁闭审批_测试.xlsx', '禁闭审批'),
    ('/template-sync/restraint', f'{TEST_DIR}/戒具使用_测试.xlsx', '戒具使用'),
    ('/template-sync/mail', f'{TEST_DIR}/信件汇总_测试.xlsx', '信件汇总'),
    ('/template-sync/blacklist', f'{TEST_DIR}/涉黑恶名单_测试.xlsx', '涉黑恶名单'),
]

results = []
for endpoint, filepath, name in tests:
    print(f'\n测试: {name}')
    with open(filepath, 'rb') as f:
        files = {'file': (os.path.basename(filepath), f)}
        resp = requests.post(f'{API_BASE}{endpoint}', files=files, headers=headers)
    
    if resp.status_code == 200:
        r = resp.json()
        inserted = r['stats']['inserted']
        updated = r['stats']['updated']
        print(f'  ✅ 成功! 新增:{inserted} 更新:{updated}')
        results.append((name, True, inserted, updated))
    else:
        print(f'  ❌ 失败: {resp.text[:100]}')
        results.append((name, False, 0, 0))

# 获取统计
print('\n' + '='*60)
print('最终统计')
print('='*60)
resp = requests.get(f'{API_BASE}/template-sync/stats', headers=headers)
if resp.status_code == 200:
    s = resp.json()
    print(f'  罪犯信息: {s["prisoners"]}')
    print(f'  严管教育: {s["strictEducation"]}')
    print(f'  禁闭记录: {s["confinement"]}')
    print(f'  戒具使用: {s["restraint"]}')
    print(f'  信件记录: {s["mail"]}')
    print(f'  涉黑恶名单: {s["blacklist"]}')
    print(f'  总计: {s["total"]}')

# 汇总
print('\n' + '='*60)
print('测试结果汇总')
print('='*60)
passed = sum(1 for r in results if r[1])
for name, success, inserted, updated in results:
    status = '✅' if success else '❌'
    print(f'  {status} {name}: {"成功" if success else "失败"} (+{inserted}/↻{updated})')
print(f'\n通过: {passed}/{len(results)}')
print('\n✅ 测试完成!')
