import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { openDB } from 'idb'

// IndexedDB 数据库配置
const DB_NAME = 'paizhu-offline-db'
const DB_VERSION = 1

// 初始化 IndexedDB
async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // 离线表单数据
            if (!db.objectStoreNames.contains('forms')) {
                db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true })
            }
            // 离线附件
            if (!db.objectStoreNames.contains('attachments')) {
                db.createObjectStore('attachments', { keyPath: 'id', autoIncrement: true })
            }
            // 同步队列
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
            }
        }
    })
}

export const useOfflineStore = defineStore('offline', () => {
    // 离线状态
    const isOnline = ref(navigator.onLine)

    // 待同步数据数量
    const pendingSyncCount = ref(0)

    // 是否有待同步数据
    const hasPendingData = computed(() => pendingSyncCount.value > 0)

    // 监听网络状态变化
    window.addEventListener('online', () => {
        isOnline.value = true
        syncPendingData()
    })
    window.addEventListener('offline', () => {
        isOnline.value = false
    })

    // 保存表单数据到 IndexedDB
    async function saveFormOffline(formType, formData) {
        const db = await initDB()
        const record = {
            type: formType,
            data: formData,
            createdAt: new Date().toISOString(),
            synced: false
        }
        await db.add('forms', record)
        await updatePendingCount()
        return record
    }

    // 保存附件到 IndexedDB
    async function saveAttachmentOffline(file, metadata) {
        const db = await initDB()
        const record = {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: await file.arrayBuffer(),
            metadata,
            createdAt: new Date().toISOString(),
            synced: false
        }
        await db.add('attachments', record)
        await updatePendingCount()
        return record
    }

    // 获取所有待同步数据
    async function getPendingData() {
        const db = await initDB()
        const forms = await db.getAll('forms')
        const attachments = await db.getAll('attachments')
        return {
            forms: forms.filter(f => !f.synced),
            attachments: attachments.filter(a => !a.synced)
        }
    }

    // 更新待同步数量
    async function updatePendingCount() {
        const { forms, attachments } = await getPendingData()
        pendingSyncCount.value = forms.length + attachments.length
    }

    // 同步待上传数据
    async function syncPendingData() {
        if (!isOnline.value) return

        const { forms, attachments } = await getPendingData()
        const db = await initDB()
        const token = localStorage.getItem('token')
        const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:3000'

        // 同步表单数据（日志）
        for (const form of forms) {
            try {
                if (form.type === 'daily-log') {
                    // 构建提交数据
                    const submitData = {
                        log_date: form.data.date,
                        prison_name: form.data.prisonName,
                        inspector_name: form.data.inspectorName,
                        three_scenes: form.data.threeScenes,
                        strict_control: form.data.strictControl,
                        police_equipment: form.data.policeEquipment,
                        gang_prisoners: form.data.gangPrisoners,
                        admission: form.data.admission,
                        monitor_check: form.data.monitorCheck,
                        supervision_situation: form.data.supervisionSituation,
                        feedback_situation: form.data.feedbackSituation,
                        other_work: form.data.otherWork,
                        notes: form.data.notes
                    }

                    const response = await fetch(`${API_BASE}/api/daily-logs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(submitData)
                    })

                    if (response.ok) {
                        form.synced = true
                        await db.put('forms', form)
                        console.log('日志同步成功:', form.data.date)
                    }
                } else {
                    // 其他类型表单暂时标记为已同步
                    form.synced = true
                    await db.put('forms', form)
                }
            } catch (error) {
                console.error('同步表单失败:', error)
            }
        }

        // 同步附件
        for (const attachment of attachments) {
            try {
                const formData = new FormData()
                const blob = new Blob([attachment.fileData], { type: attachment.fileType })
                formData.append('file', blob, attachment.fileName)

                if (attachment.metadata) {
                    Object.keys(attachment.metadata).forEach(key => {
                        formData.append(key, attachment.metadata[key])
                    })
                }

                const response = await fetch(`${API_BASE}/api/attachments/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                })

                if (response.ok) {
                    attachment.synced = true
                    await db.put('attachments', attachment)
                    console.log('附件同步成功:', attachment.fileName)
                }
            } catch (error) {
                console.error('同步附件失败:', error)
            }
        }

        await updatePendingCount()

        // 如果有数据同步成功，显示提示
        if (forms.length > 0 || attachments.length > 0) {
            console.log(`同步完成: ${forms.length}个日志, ${attachments.length}个附件`)
        }
    }

    // 清理已同步数据
    async function clearSyncedData() {
        const db = await initDB()
        const forms = await db.getAll('forms')
        const attachments = await db.getAll('attachments')

        for (const form of forms.filter(f => f.synced)) {
            await db.delete('forms', form.id)
        }
        for (const attachment of attachments.filter(a => a.synced)) {
            await db.delete('attachments', attachment.id)
        }
    }

    // 初始化时更新待同步数量
    updatePendingCount()

    return {
        isOnline,
        pendingSyncCount,
        hasPendingData,
        saveFormOffline,
        saveAttachmentOffline,
        getPendingData,
        syncPendingData,
        clearSyncedData
    }
})
