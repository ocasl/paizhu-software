const fs = require('fs');
const path = require('path');
const { generateLogFromTemplate } = require('./utils/templateGenerator');

async function test() {
    console.log('Starting template generation test...');

    const mockLog = {
        log_date: '2026-05-20',
        prison_name: '测试监狱',
        inspector_name: '测试检察官',
        three_scenes: {
            labor: { checked: true, locations: ['一监区车间', '二监区车间'] },
            living: { checked: true, locations: ['监舍楼'] },
            study: { checked: false, locations: [] }
        },
        strict_control: { newCount: 2, totalCount: 5, confinementNew: 1, confinementTotal: 2 },
        police_equipment: { checked: true, count: 888 }, // Use unique number
        gang_prisoners: { newCount: 333, totalCount: 10 },
        admission: { inCount: 5, outCount: 3 },
        monitor_check: { checked: true, count: 4 },
        supervision_situation: '发现一处安全隐患',
        feedback_situation: '已整改完成',
        other_work: { supervisionSituation: '其他监督事项', feedbackSituation: '其他反馈事项' },
        notes: '备注测试'
    };

    try {
        const buffer = await generateLogFromTemplate(mockLog);
        const outputPath = path.join(__dirname, 'test_output.docx');
        fs.writeFileSync(outputPath, buffer);
        console.log(`Test document generated at: ${outputPath}`);
    } catch (e) {
        console.error('Error generation failed:', e);
    }
}

test();
