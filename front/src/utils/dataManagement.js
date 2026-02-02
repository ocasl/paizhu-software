/**
 * 数据管理前端工具函数（更新版）
 */

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/**
 * 清空所有数据
 */
export async function clearAllData() {
    try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
            `${API_BASE_URL}/data-management/clear-all`,
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        return response.data
    } catch (error) {
        throw new Error(error.response?.data?.error || '清空数据失败')
    }
}

/**
 * 清空指定日期的数据
 */
export async function clearDataByDate(date) {
    try {
        const token = localStorage.getItem('token')
        const response = await axios.delete(
            `${API_BASE_URL}/data-management/clear-by-date`,
            {
                params: { date },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        return response.data
    } catch (error) {
        throw new Error(error.response?.data?.error || '清空数据失败')
    }
}

/**
 * 清空指定月份的数据
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {string} prisonName - 监狱名称（可选，如果提供则只清空该监狱的数据）
 */
export async function clearDataByMonth(year, month, prisonName = null) {
    try {
        const token = localStorage.getItem('token')
        const params = { year, month }
        if (prisonName) {
            params.prison_name = prisonName
        }
        const response = await axios.delete(
            `${API_BASE_URL}/data-management/clear-by-month`,
            {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        )
        return response.data
    } catch (error) {
        throw new Error(error.response?.data?.error || '清空数据失败')
    }
}
