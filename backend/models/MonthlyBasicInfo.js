/**
 * MonthlyBasicInfo 模型
 * 月度基本信息表 - 用于报告预览和报告清单
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const MonthlyBasicInfo = sequelize.define('MonthlyBasicInfo', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '用户ID'
        },
        prison_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '派驻单位'
        },
        report_month: {
            type: DataTypes.STRING(7),
            allowNull: false,
            comment: '报告月份 YYYY-MM'
        },
        // 罪犯构成
        total_prisoners: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '在押罪犯总数'
        },
        major_criminals: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '重大刑事犯'
        },
        death_sentence: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '死缓犯'
        },
        life_sentence: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '无期犯'
        },
        repeat_offenders: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '二次以上判刑罪犯'
        },
        foreign_prisoners: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '外籍犯'
        },
        hk_macao_taiwan: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '港澳台罪犯'
        },
        mental_illness: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '精神病犯'
        },
        former_officials: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '原地厅以上罪犯'
        },
        former_county_level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '原县团级以上罪犯'
        },
        falun_gong: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '法轮功'
        },
        drug_history: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '有吸毒史罪犯'
        },
        drug_crimes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '涉毒犯'
        },
        new_admissions: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '新收押罪犯'
        },
        minor_females: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '未成年女犯'
        },
        gang_related: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '涉黑罪犯'
        },
        evil_forces: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '涉恶罪犯'
        },
        endangering_safety: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '危安罪犯'
        },
        released_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '刑满释放出监罪犯'
        },
        // 违纪统计
        recorded_punishments: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '记过人数'
        },
        recorded_punishments_reason: {
            type: DataTypes.TEXT,
            comment: '记过原因'
        },
        confinement_punishments: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '禁闭人数'
        },
        confinement_reason: {
            type: DataTypes.TEXT,
            comment: '禁闭原因'
        },
        // 信件统计
        letters_received: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '收到信件数量'
        },
        // 执法检察情况（9个字段）
        parole_batch: {
            type: DataTypes.STRING(50),
            comment: '减刑批次（如：第3批）'
        },
        parole_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '减刑案件数量'
        },
        parole_stage: {
            type: DataTypes.STRING(50),
            comment: '减刑阶段（review/publicize/submitted/approved）'
        },
        correction_notices: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '纠正违法通知书份数'
        },
        correction_issues: {
            type: DataTypes.TEXT,
            comment: '纠正违法问题描述'
        },
        three_scene_checks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '三大现场检察次数'
        },
        key_location_checks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '重点场所检察次数（医务室、严管、禁闭室等）'
        },
        visit_checks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '会见检察次数'
        },
        visit_illegal_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '会见发现违法问题数'
        },
        // 安全防范检察（2个字段）
        monitor_checks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '监控检察次数'
        },
        issues_found: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '安全防范发现问题数'
        },
        // 个别谈话（6个字段）
        total_talks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '个别教育谈话总数'
        },
        new_admission_talks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '新收押罪犯谈话人数'
        },
        evil_forces_talks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '涉恶罪犯谈话人数'
        },
        injury_talks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '外伤罪犯谈话人数'
        },
        confinement_talks: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '禁闭罪犯谈话人数'
        },
        questionnaire_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '出监问卷调查表份数'
        },
        // 会议活动（3个字段）
        life_sentence_reviews: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '无期死缓评审会次数'
        },
        analysis_meetings: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '犯情分析会次数'
        },
        other_activities: {
            type: DataTypes.TEXT,
            comment: '参加其他活动名称'
        },
        // 其他工作（1个字段）
        mailbox_opens: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '开启检察官信箱次数'
        }
    }, {
        tableName: 'monthly_basic_info',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['prison_name', 'report_month'],
                name: 'unique_prison_month'
            },
            {
                fields: ['user_id'],
                name: 'idx_user_id'
            },
            {
                fields: ['report_month'],
                name: 'idx_report_month'
            }
        ]
    })

    return MonthlyBasicInfo
}
