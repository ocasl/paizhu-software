/**
 * 本地附件管理器
 * 
 * 平板端是单机版，附件保存到本地文件系统
 * 不上传到服务器
 */

import * as FileSystem from 'expo-file-system/legacy';
import { getLocalDateString } from './dateUtils';

// 附件存储根目录
const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`;

/**
 * 初始化附件目录
 */
export async function initAttachmentsDirectory() {
    try {
        const dirInfo = await FileSystem.getInfoAsync(ATTACHMENTS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true });
            console.log('✅ 附件目录已创建:', ATTACHMENTS_DIR);
        }
        return true;
    } catch (error) {
        console.error('❌ 创建附件目录失败:', error);
        return false;
    }
}

/**
 * 生成规范化的文件名
 * 格式：日期_类型_原始文件名_时间戳.扩展名
 * 
 * @param {string} originalUri - 原始文件URI
 * @param {string} category - 附件类别
 * @param {string} logDate - 日志记录日期（YYYY-MM-DD）
 * @returns {string} 格式化的文件名
 */
function generateFileName(originalUri, category, logDate) {
    // 提取原始文件名和扩展名
    const fileName = originalUri.split('/').pop();
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '.jpg';
    const baseName = fileName.replace(ext, '').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    
    // 格式化日期：2026-01-17 -> 20260117
    const date = logDate ? logDate.replace(/-/g, '') : getLocalDateString().replace(/-/g, '');
    
    // 生成时间戳
    const timestamp = Date.now();
    
    // 需要规范化命名的类别
    const needsFormatting = [
        'daily_log',
        'weekly_hospital',
        'weekly_injury',
        'weekly_talk',
        'weekly_contraband',
        'monthly_punishment'
    ];
    
    if (needsFormatting.includes(category)) {
        // 规范化命名：日期_类型_文件名_时间戳.扩展名
        return `${date}_${category}_${baseName}_${timestamp}${ext}`;
    } else {
        // 一般材料保持原文件名
        return fileName;
    }
}

/**
 * 保存附件到本地
 * 
 * @param {Object} file - 文件对象 { uri, name, type }
 * @param {string} category - 附件类别
 * @param {string} logDate - 日志记录日期（YYYY-MM-DD）
 * @returns {Promise<Object>} 附件信息
 */
export async function saveAttachmentLocally(file, category, logDate) {
    try {
        // 确保目录存在
        await initAttachmentsDirectory();
        
        // 生成文件名
        const fileName = generateFileName(file.uri, category, logDate);
        const destPath = `${ATTACHMENTS_DIR}${fileName}`;
        
        // 复制文件到附件目录
        await FileSystem.copyAsync({
            from: file.uri,
            to: destPath
        });
        
        // 获取文件信息
        const fileInfo = await FileSystem.getInfoAsync(destPath);
        
        console.log('✅ 附件已保存:', fileName);
        
        return {
            id: Date.now(), // 临时ID
            original_name: file.name || fileName,
            file_name: fileName,
            file_path: destPath,
            file_size: fileInfo.size || 0,
            mime_type: file.type || 'application/octet-stream',
            category: category,
            log_date: logDate,
            created_at: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ 保存附件失败:', error);
        throw error;
    }
}

/**
 * 批量保存附件
 * 
 * @param {Array} files - 文件数组
 * @param {string} category - 附件类别
 * @param {string} logDate - 日志记录日期
 * @returns {Promise<Array>} 附件信息数组
 */
export async function saveAttachmentsLocally(files, category, logDate) {
    if (!files || files.length === 0) {
        return [];
    }
    
    const savedAttachments = [];
    
    for (const file of files) {
        try {
            const attachment = await saveAttachmentLocally(file, category, logDate);
            savedAttachments.push(attachment);
        } catch (error) {
            console.error('保存附件失败:', file.name, error);
            // 继续处理其他文件
        }
    }
    
    return savedAttachments;
}

/**
 * 删除附件
 * 
 * @param {string} filePath - 文件路径
 */
export async function deleteAttachment(filePath) {
    try {
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
            await FileSystem.deleteAsync(filePath);
            console.log('✅ 附件已删除:', filePath);
        }
    } catch (error) {
        console.error('❌ 删除附件失败:', error);
    }
}

/**
 * 获取指定日期的所有附件
 * 
 * @param {string} date - 日期（YYYY-MM-DD）
 * @returns {Promise<Array>} 附件列表
 */
export async function getAttachmentsByDate(date) {
    try {
        const dateStr = date.replace(/-/g, ''); // 20260117
        const files = await FileSystem.readDirectoryAsync(ATTACHMENTS_DIR);
        
        // 筛选出该日期的附件
        const attachments = files
            .filter(fileName => fileName.startsWith(dateStr))
            .map(fileName => ({
                file_name: fileName,
                file_path: `${ATTACHMENTS_DIR}${fileName}`,
                original_name: extractOriginalName(fileName),
                category: extractCategory(fileName),
                log_date: date
            }));
        
        return attachments;
    } catch (error) {
        console.error('❌ 获取附件列表失败:', error);
        return [];
    }
}

/**
 * 从文件名中提取原始文件名
 * 格式：20260117_weekly_injury_外伤照片_1737936000000.jpg
 * 
 * @param {string} fileName - 文件名
 * @returns {string} 原始文件名
 */
function extractOriginalName(fileName) {
    const parts = fileName.split('_');
    if (parts.length >= 4) {
        // 提取中间的文件名部分
        const nameParts = parts.slice(2, -1);
        const ext = fileName.split('.').pop();
        return nameParts.join('_') + '.' + ext;
    }
    return fileName;
}

/**
 * 从文件名中提取类别
 * 格式：20260117_weekly_injury_外伤照片_1737936000000.jpg
 * 
 * @param {string} fileName - 文件名
 * @returns {string} 类别
 */
function extractCategory(fileName) {
    const parts = fileName.split('_');
    if (parts.length >= 2) {
        return parts[1]; // weekly, monthly, daily等
    }
    return 'general';
}

/**
 * 获取所有附件
 * 
 * @returns {Promise<Array>} 附件列表
 */
export async function getAllAttachments() {
    try {
        const files = await FileSystem.readDirectoryAsync(ATTACHMENTS_DIR);
        
        const attachments = await Promise.all(
            files.map(async (fileName) => {
                const filePath = `${ATTACHMENTS_DIR}${fileName}`;
                const fileInfo = await FileSystem.getInfoAsync(filePath);
                
                return {
                    file_name: fileName,
                    file_path: filePath,
                    file_size: fileInfo.size || 0,
                    original_name: extractOriginalName(fileName),
                    category: extractCategory(fileName),
                    created_at: new Date(fileInfo.modificationTime * 1000).toISOString()
                };
            })
        );
        
        // 按创建时间倒序排列
        return attachments.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
    } catch (error) {
        console.error('❌ 获取所有附件失败:', error);
        return [];
    }
}

/**
 * 清理指定日期之前的附件（可选功能）
 * 
 * @param {string} beforeDate - 日期（YYYY-MM-DD）
 */
export async function cleanupOldAttachments(beforeDate) {
    try {
        const dateStr = beforeDate.replace(/-/g, '');
        const files = await FileSystem.readDirectoryAsync(ATTACHMENTS_DIR);
        
        let deletedCount = 0;
        for (const fileName of files) {
            const fileDateStr = fileName.substring(0, 8);
            if (fileDateStr < dateStr) {
                await FileSystem.deleteAsync(`${ATTACHMENTS_DIR}${fileName}`);
                deletedCount++;
            }
        }
        
        console.log(`✅ 已清理 ${deletedCount} 个旧附件`);
        return deletedCount;
    } catch (error) {
        console.error('❌ 清理旧附件失败:', error);
        return 0;
    }
}

/**
 * 获取附件目录大小
 * 
 * @returns {Promise<number>} 目录大小（字节）
 */
export async function getAttachmentsSize() {
    try {
        const files = await FileSystem.readDirectoryAsync(ATTACHMENTS_DIR);
        let totalSize = 0;
        
        for (const fileName of files) {
            const fileInfo = await FileSystem.getInfoAsync(`${ATTACHMENTS_DIR}${fileName}`);
            totalSize += fileInfo.size || 0;
        }
        
        return totalSize;
    } catch (error) {
        console.error('❌ 获取附件大小失败:', error);
        return 0;
    }
}

/**
 * 格式化文件大小
 * 
 * @param {number} bytes - 字节数
 * @returns {string} 格式化的大小
 */
export function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
