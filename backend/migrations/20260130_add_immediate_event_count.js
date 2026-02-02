/**
 * 添加及时检察事件统计字段到月度归档表
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('monthly_archives', 'immediate_event_count', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            comment: '及时检察事件数量'
        })
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('monthly_archives', 'immediate_event_count')
    }
}
