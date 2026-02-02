/**
 * 犯情动态文档解析器
 * 使用正则表达式从Word/文本文档中提取统计数据
 * 无需AI大模型，纯算法实现
 */

/**
 * 解析犯情动态文档，提取统计数据
 * @param {string} content - 文档文本内容
 * @returns {object} 解析结果
 */
function parseCriminalReport(content) {
    const result = {
        // 基本信息
        prison: null,           // 监狱名称
        period: null,           // 期数
        month: null,            // 月份
        reportDate: null,       // 报告日期

        // 监管安全情况
        security: {
            hasEscape: false,           // 是否有脱逃
            hasMajorCase: false,        // 是否有重大案件
            hasSafetyAccident: false,   // 是否有安全事故
            hasHealthEvent: false,      // 是否有公共卫生事件
            hasInternalCase: false,     // 是否有狱内发案
            hasPremeditatedCase: false, // 是否有预谋案件
        },

        // 罪犯违纪统计
        discipline: {
            violationCount: null,       // 违规人数
            confinementCount: null,     // 禁闭人数
            warningCount: null,         // 警告人数
            dismissedCount: null,       // 撤销岗位人数
        },

        // 罪犯构成情况（核心数据）
        prisoners: {
            total: null,                // 在押罪犯总数
            majorCriminal: null,        // 重大刑事犯
            deathSuspended: null,       // 死缓犯
            lifeSentence: null,         // 无期犯
            multipleConvictions: null,  // 二次以上判刑
            foreign: null,              // 外籍犯
            hongKongMacaoTaiwan: null,  // 港澳台
            mentalIllness: null,        // 精神病犯
            formerProvincial: null,     // 原地厅以上
            formerCounty: null,         // 原县团级以上
            falunGong: null,            // 法轮功
            drugHistory: null,          // 有吸毒史
            drugRelated: null,          // 涉毒犯
            newlyAdmitted: null,        // 新收押罪犯
            juvenileFemale: null,       // 未成年女犯
            gangRelated: null,          // 涉黑罪犯
            evilRelated: null,          // 涉恶罪犯
            dangerousSecurity: null,    // 危安罪犯
        },

        // 采取防范措施的案例
        preventiveMeasures: [],

        // 原始文本段落
        rawSections: {}
    }

    // 1. 提取基本信息
    const prisonMatch = content.match(/([^\s]+省[^\s]+监狱)/);
    if (prisonMatch) result.prison = prisonMatch[1];

    const periodMatch = content.match(/第\s*(\d+)\s*期/);
    if (periodMatch) result.period = parseInt(periodMatch[1]);

    const monthMatch = content.match(/(\d+)\s*月犯情动态/);
    if (monthMatch) result.month = parseInt(monthMatch[1]);

    const dateMatch = content.match(/(\d{4})\s*年\s*(\d+)\s*月\s*(\d+)\s*日/);
    if (dateMatch) {
        result.reportDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
    }

    // 2. 提取监管安全情况
    result.security.hasEscape = !content.includes('无罪犯脱逃');
    result.security.hasMajorCase = !content.includes('无在全国全省有重大影响的狱内案件');
    result.security.hasSafetyAccident = !content.includes('无重大安全生产事故');
    result.security.hasHealthEvent = !content.includes('无重大公共卫生安全事件');
    result.security.hasInternalCase = !content.includes('无狱内发案');
    result.security.hasPremeditatedCase = !content.includes('未发生预谋案件');

    // 3. 提取罪犯违纪统计（支持空格）
    const violationMatch = content.match(/(\d+)\s*名罪犯在担任.*?期间[违反规]/);
    if (violationMatch) result.discipline.violationCount = parseInt(violationMatch[1].replace(/\s+/g, ''));

    const dismissedMatch = content.match(/撤销\s*(\d+)\s*人狱内勤杂岗位/);
    if (dismissedMatch) result.discipline.dismissedCount = parseInt(dismissedMatch[1].replace(/\s+/g, ''));

    const confinementMatch = content.match(/禁闭\s*(\d+)\s*人/);
    if (confinementMatch) result.discipline.confinementCount = parseInt(confinementMatch[1].replace(/\s+/g, ''));

    const warningMatch = content.match(/警告\s*(\d+)\s*人/);
    if (warningMatch) result.discipline.warningCount = parseInt(warningMatch[1].replace(/\s+/g, ''));

    // 4. 提取罪犯构成情况（核心数据）
    // 支持数字前后有空格的情况，如"在押罪犯 1286 人"或"在押罪犯1286人"
    const extractNumber = (pattern) => {
        const match = content.match(pattern);
        return match ? parseInt(match[1].replace(/\s+/g, '')) : null;
    };

    result.prisoners.total = extractNumber(/在押罪犯\s*(\d+)\s*人/);
    result.prisoners.majorCriminal = extractNumber(/重大刑事犯\s*(\d+)\s*名/);
    result.prisoners.deathSuspended = extractNumber(/死缓犯\s*(\d+)\s*名/);
    result.prisoners.lifeSentence = extractNumber(/无期犯\s*(\d+)\s*名/);
    result.prisoners.multipleConvictions = extractNumber(/二次以上判刑罪犯\s*(\d+)\s*名/);
    result.prisoners.foreign = extractNumber(/外籍犯\s*(\d+)\s*名/);
    result.prisoners.hongKongMacaoTaiwan = extractNumber(/含港澳台\s*(\d+)\s*名/);
    result.prisoners.mentalIllness = extractNumber(/精神病犯\s*(\d+)\s*名/);
    result.prisoners.formerProvincial = extractNumber(/原地厅以上罪犯\s*(\d+)\s*名/);
    result.prisoners.formerCounty = extractNumber(/原县团级以上罪犯\s*(\d+)\s*名/);
    result.prisoners.falunGong = extractNumber(/"法轮功"[^0-9]*(\d+)\s*名/);
    result.prisoners.drugHistory = extractNumber(/有吸毒史罪犯\s*(\d+)\s*名/);
    result.prisoners.drugRelated = extractNumber(/涉毒犯\s*(\d+)\s*名/);
    result.prisoners.newlyAdmitted = extractNumber(/新收押罪犯\s*(\d+)\s*名/);
    result.prisoners.juvenileFemale = extractNumber(/未成年女犯\s*(\d+)\s*名/);
    result.prisoners.gangRelated = extractNumber(/涉黑罪犯\s*(\d+)\s*名/);
    result.prisoners.evilRelated = extractNumber(/涉恶罪犯\s*(\d+)\s*名/);
    result.prisoners.dangerousSecurity = extractNumber(/危安罪犯\s*(\d+)\s*名/);

    // 5. 提取采取防范措施的案例（支持空格和更灵活的格式）
    const measurePattern = /([^监区\s]+监区)罪犯([^\（\(]+)[（\(]([^，,]+)[，,](\d+)\s*岁[，,]([^，,]+)[，,]([^，,]+)[，,]原判\s*([^，,]+)[，,].*?余刑\s*([^\）\)]+)[）\)].*?对其采取([^。]+)/g;
    let match;
    while ((match = measurePattern.exec(content)) !== null) {
        result.preventiveMeasures.push({
            area: match[1].trim(),           // 监区
            name: match[2].trim(),           // 姓名
            gender: match[3].trim(),         // 性别
            age: parseInt(match[4]),         // 年龄
            origin: match[5].trim(),         // 籍贯
            crime: match[6].trim(),          // 罪名
            originalSentence: match[7].trim(), // 原判
            remainingSentence: match[8].trim(), // 余刑
            measure: match[9].trim()         // 采取措施
        });
    }

    // 6. 提取各章节原文
    const sectionPatterns = [
        { key: 'security', pattern: /一、监管安全情况([\s\S]*?)(?=二、|$)/ },
        { key: 'features', pattern: /二、主要犯情及特点([\s\S]*?)(?=三、|$)/ },
        { key: 'overall', pattern: /三、整体狱情情况([\s\S]*?)(?=四、|$)/ },
        { key: 'measures', pattern: /四、下一步工作措施([\s\S]*?)(?=\d{4}年|$)/ },
    ];

    for (const { key, pattern } of sectionPatterns) {
        const match = content.match(pattern);
        if (match) {
            result.rawSections[key] = match[1].trim();
        }
    }

    return result;
}

/**
 * 从Word文档解析犯情动态
 * @param {string} filePath - Word文件路径
 * @returns {Promise<object>} 解析结果
 */
async function parseFromWord(filePath) {
    const mammoth = require('mammoth');
    const fs = require('fs');

    // 读取Word文档转为文本
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    return parseCriminalReport(text);
}

/**
 * 生成统计摘要
 * @param {object} data - 解析结果
 * @returns {string} 格式化的统计摘要
 */
function generateSummary(data) {
    const p = data.prisoners;

    let summary = `
【${data.prison || 'XX监狱'} ${data.month || '*'}月犯情动态统计】

一、监管安全情况
  ✓ 罪犯脱逃: ${data.security.hasEscape ? '有' : '无'}
  ✓ 重大案件: ${data.security.hasMajorCase ? '有' : '无'}
  ✓ 安全事故: ${data.security.hasSafetyAccident ? '有' : '无'}
  ✓ 卫生事件: ${data.security.hasHealthEvent ? '有' : '无'}
  ✓ 狱内发案: ${data.security.hasInternalCase ? '有' : '无'}

二、罪犯违纪统计
  • 违规人数: ${data.discipline.violationCount ?? '-'}
  • 禁闭人数: ${data.discipline.confinementCount ?? '-'}
  • 警告人数: ${data.discipline.warningCount ?? '-'}

三、罪犯构成情况
  • 在押罪犯总数: ${p.total ?? '-'}
  • 重大刑事犯: ${p.majorCriminal ?? '-'}
  • 死缓犯: ${p.deathSuspended ?? '-'}
  • 无期犯: ${p.lifeSentence ?? '-'}
  • 涉黑罪犯: ${p.gangRelated ?? '-'}
  • 涉恶罪犯: ${p.evilRelated ?? '-'}
  • 涉毒犯: ${p.drugRelated ?? '-'}
  • 新收押罪犯: ${p.newlyAdmitted ?? '-'}

四、防范措施案例: ${data.preventiveMeasures.length}起
`;

    return summary;
}

module.exports = {
    parseCriminalReport,
    parseFromWord,
    generateSummary
};

// 测试代码
if (require.main === module) {
    const testContent = `
内部资料
注意保存                                   编号：

犯  情  动  态
第10期
江西省XX监狱                      2025年10月15日

十月犯情动态

10月，我监认真贯彻落实上级的通知要求...
一、监管安全情况
（一）监管安全基本情况。本月，我监无罪犯脱逃、无在全国全省有重大影响的狱内案件、无重大安全生产事故、无重大公共卫生安全事件，监狱持续安全稳定。
（二）狱内发案情况。本月，我监无狱内发案。
（三）侦破预谋案件情况。本月，我监未发生预谋案件。
（四）罪犯违纪数据统计。本月，我监整体改造秩序平稳可控。本月，3名罪犯在担任劳动期间违规使用手机，已撤销3人狱内勤杂岗位并给予行政处罚（禁闭2人、警告1人）。
（五）罪犯构成情况。截至10月31日，监狱在押罪犯1258人，其中重大刑事犯326名，死缓犯15名，无期犯89名，二次以上判刑罪犯156名，外籍犯8名（含港澳台3名），判决书认定的精神病犯12名，原地厅以上罪犯5名，原县团级以上罪犯23名，"法轮功"2名，有吸毒史罪犯234名，涉毒犯189名，新收押罪犯45名，未成年女犯0名，涉黑罪犯28名，涉恶罪犯56名，危安罪犯12名。
二、主要犯情及特点
（一）个别罪犯存在现实危险性，被采取防范措施
如：五监区罪犯某某（35岁，故意伤害罪、虐待罪，原判8年6个月，余刑3年2个月），2025年10月5日，该犯与同犯因生活问题发生矛盾导致情绪波动，并企图用安全笔扎手腕，被值班民警及时制止。鉴于该犯存在现实危险性，经审批对其采取加戴手铐进行防范。
`;

    const result = parseCriminalReport(testContent);
    console.log(generateSummary(result));
    console.log('\n详细数据:');
    console.log(JSON.stringify(result.prisoners, null, 2));
}
