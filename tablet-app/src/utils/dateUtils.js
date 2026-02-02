/**
 * 日期工具函数
 * 
 * 解决时区问题：使用本地时区而不是UTC时区
 */

/**
 * 获取本地日期字符串（YYYY-MM-DD格式）
 * 避免使用 toISOString() 导致的时区问题
 * 
 * @param {Date} date - 日期对象，默认为当前日期
 * @returns {string} 格式化的日期字符串，如 "2026-01-26"
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取本地年月字符串（YYYY-MM格式）
 * 
 * @param {Date} date - 日期对象，默认为当前日期
 * @returns {string} 格式化的年月字符串，如 "2026-01"
 */
export function getLocalYearMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 获取本地日期时间字符串（YYYY-MM-DD HH:mm:ss格式）
 * 
 * @param {Date} date - 日期对象，默认为当前日期
 * @returns {string} 格式化的日期时间字符串，如 "2026-01-26 14:30:00"
 */
export function getLocalDateTimeString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
