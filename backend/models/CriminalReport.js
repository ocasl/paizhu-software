/**
 * 犯情动态统计数据模型
 * 存储从犯情动态Word文档解析出的统计数据
 */
const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const CriminalReport = sequelize.define('CriminalReport', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        // 基本信息
        prison_name: {
            type: DataTypes.STRING(100),
            comment: '监狱名称'
        },
        report_month: {
            type: DataTypes.STRING(10),
            allowNull: false,
            comment: '报告月份，格式：2025-10'
        },
        report_date: {
            type: DataTypes.DATEONLY,
            comment: '报告日期'
        },
        period: {
            type: DataTypes.INTEGER,
            comment: '期数'
        },

        // 监管安全情况
        has_escape: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否有罪犯脱逃'
        },
        has_major_case: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否有重大案件'
        },
        has_safety_accident: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否有安全事故'
        },
        has_health_event: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否有公共卫生事件'
        },
        has_internal_case: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否有狱内发案'
        },

        // 罪犯违纪统计
        violation_count: {
            type: DataTypes.INTEGER,
            comment: '违规人数'
        },
        confinement_count: {
            type: DataTypes.INTEGER,
            comment: '禁闭人数'
        },
        warning_count: {
            type: DataTypes.INTEGER,
            comment: '警告人数'
        },

        // 罪犯构成情况
        total_prisoners: {
            type: DataTypes.INTEGER,
            comment: '在押罪犯总数'
        },
        major_criminal: {
            type: DataTypes.INTEGER,
            comment: '重大刑事犯'
        },
        death_suspended: {
            type: DataTypes.INTEGER,
            comment: '死缓犯'
        },
        life_sentence: {
            type: DataTypes.INTEGER,
            comment: '无期犯'
        },
        multiple_convictions: {
            type: DataTypes.INTEGER,
            comment: '二次以上判刑'
        },
        foreign_prisoners: {
            type: DataTypes.INTEGER,
            comment: '外籍犯'
        },
        hk_macao_taiwan: {
            type: DataTypes.INTEGER,
            comment: '港澳台'
        },
        mental_illness: {
            type: DataTypes.INTEGER,
            comment: '精神病犯'
        },
        former_provincial: {
            type: DataTypes.INTEGER,
            comment: '原地厅以上'
        },
        former_county: {
            type: DataTypes.INTEGER,
            comment: '原县团级以上'
        },
        falun_gong: {
            type: DataTypes.INTEGER,
            comment: '法轮功'
        },
        drug_history: {
            type: DataTypes.INTEGER,
            comment: '有吸毒史'
        },
        drug_related: {
            type: DataTypes.INTEGER,
            comment: '涉毒犯'
        },
        newly_admitted: {
            type: DataTypes.INTEGER,
            comment: '新收押罪犯'
        },
        juvenile_female: {
            type: DataTypes.INTEGER,
            comment: '未成年女犯'
        },
        gang_related: {
            type: DataTypes.INTEGER,
            comment: '涉黑罪犯'
        },
        evil_related: {
            type: DataTypes.INTEGER,
            comment: '涉恶罪犯'
        },
        dangerous_security: {
            type: DataTypes.INTEGER,
            comment: '危安罪犯'
        },

        // 原始文件信息
        original_filename: {
            type: DataTypes.STRING(255),
            comment: '原始文件名'
        },
        file_path: {
            type: DataTypes.STRING(500),
            comment: '文件存储路径'
        },

        // 同步信息
        sync_batch: {
            type: DataTypes.STRING(50),
            comment: '同步批次ID'
        },
        synced_at: {
            type: DataTypes.DATE,
            comment: '同步时间'
        }
    }, {
        tableName: 'criminal_reports',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['report_month'] },
            { fields: ['prison_name'] },
            { unique: true, fields: ['prison_name', 'report_month'] }
        ]
    })

    return CriminalReport
}
