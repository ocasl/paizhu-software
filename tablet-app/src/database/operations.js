// 数据库操作封装 - 支持Web预览
import { Platform } from 'react-native';

let db = null;
let isWeb = Platform.OS === 'web';

// Web端使用localStorage存储
const webStorage = {
    data: {
        daily_logs: [],
        weekly_records: [],
        monthly_records: [],
        immediate_events: [],
        attachments: [],
        settings: {},
    },

    init() {
        try {
            const stored = localStorage.getItem('paizhu_data');
            if (stored) {
                this.data = JSON.parse(stored);
                
                // 数据迁移：确保所有记录都有 syncStatus 字段
                ['daily_logs', 'weekly_records', 'monthly_records', 'immediate_events', 'attachments'].forEach(table => {
                    if (this.data[table]) {
                        this.data[table] = this.data[table].map(record => ({
                            ...record,
                            syncStatus: record.syncStatus || 'pending'
                        }));
                    }
                });
                
                this.save();
                console.log('✅ 数据迁移完成：已为所有记录添加 syncStatus 字段');
            }
        } catch (e) {
            console.log('localStorage not available');
        }
    },

    save() {
        try {
            localStorage.setItem('paizhu_data', JSON.stringify(this.data));
        } catch (e) {
            console.log('localStorage save failed');
        }
    },

    nextId(table) {
        const records = this.data[table] || [];
        return records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
    }
};

// 初始化数据库
export async function initDatabase() {
    if (isWeb) {
        webStorage.init();
        console.log('Web模式：使用localStorage存储');
        return true;
    }

    // 原生模式使用SQLite
    try {
        const SQLite = await import('expo-sqlite');
        db = await SQLite.openDatabaseAsync('paizhu.db');

        // 创建表
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        log_date TEXT NOT NULL,
        prison_name TEXT,
        inspector_name TEXT,
        three_scenes TEXT DEFAULT '{}',
        strict_control TEXT DEFAULT '{}',
        police_equipment TEXT DEFAULT '{}',
        gang_prisoners TEXT DEFAULT '{}',
        admission TEXT DEFAULT '{}',
        monitor_check TEXT DEFAULT '{}',
        supervision_situation TEXT,
        feedback_situation TEXT,
        other_work TEXT DEFAULT '{}',
        notes TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS weekly_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        record_date TEXT NOT NULL,
        week_number INTEGER,
        hospital_check TEXT DEFAULT '{}',
        injury_check TEXT DEFAULT '{}',
        talk_records TEXT DEFAULT '[]',
        mailbox TEXT DEFAULT '{}',
        contraband TEXT DEFAULT '{}',
        notes TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS monthly_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        record_month TEXT NOT NULL,
        visit_check TEXT DEFAULT '{}',
        meeting TEXT DEFAULT '{}',
        punishment TEXT DEFAULT '{}',
        position_stats TEXT DEFAULT '{}',
        notes TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS immediate_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        event_date TEXT NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT,
        parole_data TEXT,
        attachment_ids TEXT DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL DEFAULT 1,
        category TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        parsed_data TEXT,
        upload_month TEXT,
        related_log_id INTEGER,
        related_log_type TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      );
    `);

        console.log('SQLite数据库初始化成功');
        return true;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}


// Helper to save attachments
async function processAttachments(files, logId, logType, category) {
    if (!files || !Array.isArray(files)) return;
    for (const file of files) {
        // Simple check to avoid re-uploading if logic called multiple times, 
        // though for Create it's new. For Update it might duplicate. 
        // ideally we check if exists in DB.
        // For MVP we just insert.
        await createAttachment({
            category,
            original_name: file.name,
            file_name: file.name,
            file_path: file.uri,
            file_size: file.size,
            mime_type: file.type,
            related_log_id: logId,
            related_log_type: logType
        });
    }
}

// ============ 日检察操作 ============

export async function createDailyLog(data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const record = {
            id: webStorage.nextId('daily_logs'),
            user_id: 1,
            log_date: data.log_date,
            prison_name: data.prison_name || '',
            inspector_name: data.inspector_name || '',
            three_scenes: data.three_scenes || {},
            strict_control: data.strict_control || {},
            police_equipment: data.police_equipment || {},
            gang_prisoners: data.gang_prisoners || {},
            admission: data.admission || {},
            monitor_check: data.monitor_check || {},
            supervision_situation: data.supervision_situation || '',
            feedback_situation: data.feedback_situation || '',
            other_work: data.other_work || {},
            notes: data.notes || '',
            syncStatus: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        webStorage.data.daily_logs.push(record);
        webStorage.save();
        return { id: record.id };  // 返回对象
    }

    const result = await db.runAsync(
        `INSERT INTO daily_logs (
      log_date, prison_name, inspector_name, three_scenes, strict_control,
      police_equipment, gang_prisoners, admission, monitor_check,
      supervision_situation, feedback_situation, other_work, notes,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.log_date,
            data.prison_name || '',
            data.inspector_name || '',
            JSON.stringify(data.three_scenes || {}),
            JSON.stringify(data.strict_control || {}),
            JSON.stringify(data.police_equipment || {}),
            JSON.stringify(data.gang_prisoners || {}),
            JSON.stringify(data.admission || {}),
            JSON.stringify(data.monitor_check || {}),
            data.supervision_situation || '',
            data.feedback_situation || '',
            JSON.stringify(data.other_work || {}),
            data.notes || '',
            now, now
        ]
    );

    const id = result.lastInsertRowId;
    // Process attachments from Anomalies
    if (data.monitor_check?.anomalies) {
        for (const item of data.monitor_check.anomalies) {
            if (item.attachments) {
                await processAttachments(item.attachments, id, 'daily', 'monitor');
            }
        }
    }
    return { id };  // 返回对象
}

export async function getDailyLogs(limit = 50, offset = 0) {
    if (isWeb) {
        const sorted = [...webStorage.data.daily_logs].sort((a, b) =>
            new Date(b.log_date) - new Date(a.log_date)
        );
        return sorted.slice(offset, offset + limit);
    }

    if (!db) {
        console.error('数据库未初始化');
        return [];
    }

    const rows = await db.getAllAsync(
        `SELECT * FROM daily_logs ORDER BY log_date DESC LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows.map(parseJsonFields);
}

export async function getDailyLogById(id) {
    if (isWeb) {
        return webStorage.data.daily_logs.find(r => r.id === id) || null;
    }

    if (!db) {
        console.error('数据库未初始化');
        return null;
    }

    const row = await db.getFirstAsync(
        `SELECT * FROM daily_logs WHERE id = ?`,
        [id]
    );
    return row ? parseJsonFields(row) : null;
}

export async function getDailyLogByDate(dateStr) {
    if (isWeb) {
        return webStorage.data.daily_logs.find(r => r.log_date === dateStr) || null;
    }

    const row = await db.getFirstAsync(
        `SELECT * FROM daily_logs WHERE log_date = ?`,
        [dateStr]
    );
    return row ? parseJsonFields(row) : null;
}

export async function updateDailyLog(id, data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const index = webStorage.data.daily_logs.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.daily_logs[index] = {
                ...webStorage.data.daily_logs[index],
                ...data,
                syncStatus: 'pending',
                updatedAt: now,
            };
            webStorage.save();
        }
        return;
    }

    await db.runAsync(
        `UPDATE daily_logs SET
      three_scenes = ?, strict_control = ?, police_equipment = ?,
      gang_prisoners = ?, admission = ?, monitor_check = ?,
      supervision_situation = ?, feedback_situation = ?, other_work = ?,
      notes = ?, syncStatus = 'pending', updatedAt = ?
    WHERE id = ?`,
        [
            JSON.stringify(data.three_scenes || {}),
            JSON.stringify(data.strict_control || {}),
            JSON.stringify(data.police_equipment || {}),
            JSON.stringify(data.gang_prisoners || {}),
            JSON.stringify(data.admission || {}),
            JSON.stringify(data.monitor_check || {}),
            data.supervision_situation || '',
            data.feedback_situation || '',
            JSON.stringify(data.other_work || {}),
            data.notes || '',
            now, id
        ]
    );
}

export async function deleteDailyLog(id) {
    if (isWeb) {
        const index = webStorage.data.daily_logs.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.daily_logs.splice(index, 1);
            webStorage.save();
        }
        return;
    }

    await db.runAsync(`DELETE FROM daily_logs WHERE id = ?`, [id]);
}

// ============ 周检察操作 ============

export async function createWeeklyRecord(data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const record = {
            id: webStorage.nextId('weekly_records'),
            user_id: 1,
            record_date: data.record_date,
            week_number: data.week_number || 1,
            hospital_check: data.hospital_check || {},
            injury_check: data.injury_check || {},
            talk_records: data.talk_records || [],
            mailbox: data.mailbox || {},
            contraband: data.contraband || {},
            notes: data.notes || '',
            syncStatus: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        webStorage.data.weekly_records.push(record);
        webStorage.save();
        return { id: record.id };  // 返回对象
    }

    const result = await db.runAsync(
        `INSERT INTO weekly_records (
      record_date, week_number, hospital_check, injury_check,
      talk_records, mailbox, contraband, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.record_date,
            data.week_number || 1,
            JSON.stringify(data.hospital_check || {}),
            JSON.stringify(data.injury_check || {}),
            JSON.stringify(data.talk_records || []),
            JSON.stringify(data.mailbox || {}),
            JSON.stringify(data.contraband || {}),
            data.notes || '',
            now, now
        ]
    );

    const id = result.lastInsertRowId;
    return { id };  // 返回对象
}

export async function getWeeklyRecords(limit = 50, offset = 0) {
    if (isWeb) {
        const sorted = [...webStorage.data.weekly_records].sort((a, b) =>
            new Date(b.record_date) - new Date(a.log_date)
        );
        return sorted.slice(offset, offset + limit);
    }

    if (!db) {
        console.error('数据库未初始化');
        return [];
    }

    const rows = await db.getAllAsync(
        `SELECT * FROM weekly_records ORDER BY record_date DESC LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows.map(parseJsonFields);
}

export async function getWeeklyRecordById(id) {
    if (isWeb) {
        return webStorage.data.weekly_records.find(r => r.id === id) || null;
    }

    if (!db) {
        console.error('数据库未初始化');
        return null;
    }

    const row = await db.getFirstAsync(
        `SELECT * FROM weekly_records WHERE id = ?`,
        [id]
    );
    return row ? parseJsonFields(row) : null;
}

export async function updateWeeklyRecord(id, data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const index = webStorage.data.weekly_records.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.weekly_records[index] = {
                ...webStorage.data.weekly_records[index],
                ...data,
                syncStatus: 'pending',
                updatedAt: now,
            };
            webStorage.save();
        }
        return;
    }

    await db.runAsync(
        `UPDATE weekly_records SET
      record_date = ?, week_number = ?, hospital_check = ?, injury_check = ?,
      talk_records = ?, mailbox = ?, contraband = ?, notes = ?,
      syncStatus = 'pending', updatedAt = ?
    WHERE id = ?`,
        [
            data.record_date,
            data.week_number || 1,
            JSON.stringify(data.hospital_check || {}),
            JSON.stringify(data.injury_check || {}),
            JSON.stringify(data.talk_records || []),
            JSON.stringify(data.mailbox || {}),
            JSON.stringify(data.contraband || {}),
            data.notes || '',
            now, id
        ]
    );
}

export async function deleteWeeklyRecord(id) {
    if (isWeb) {
        const index = webStorage.data.weekly_records.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.weekly_records.splice(index, 1);
            webStorage.save();
        }
        return;
    }

    await db.runAsync(`DELETE FROM weekly_records WHERE id = ?`, [id]);
}

// ============ 月检察操作 ============

export async function createMonthlyRecord(data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const record = {
            id: webStorage.nextId('monthly_records'),
            user_id: 1,
            record_month: data.record_month,
            visit_check: data.visit_check || {},
            meeting: data.meeting || {},
            punishment: data.punishment || {},
            position_stats: data.position_stats || {},
            notes: data.notes || '',
            syncStatus: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        webStorage.data.monthly_records.push(record);
        webStorage.save();
        return { id: record.id };  // 返回对象
    }

    const result = await db.runAsync(
        `INSERT INTO monthly_records (
      record_month, visit_check, meeting, punishment,
      position_stats, notes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.record_month,
            JSON.stringify(data.visit_check || {}),
            JSON.stringify(data.meeting || {}),
            JSON.stringify(data.punishment || {}),
            JSON.stringify(data.position_stats || {}),
            data.notes || '',
            now, now
        ]
    );

    const id = result.lastInsertRowId;
    return { id };  // 返回对象
}

export async function getMonthlyRecords(limit = 50, offset = 0) {
    if (isWeb) {
        const sorted = [...webStorage.data.monthly_records].sort((a, b) =>
            b.record_month.localeCompare(a.record_month)
        );
        return sorted.slice(offset, offset + limit);
    }

    if (!db) {
        console.error('数据库未初始化');
        return [];
    }

    const rows = await db.getAllAsync(
        `SELECT * FROM monthly_records ORDER BY record_month DESC LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows.map(parseJsonFields);
}

export async function getMonthlyRecordById(id) {
    if (isWeb) {
        return webStorage.data.monthly_records.find(r => r.id === id) || null;
    }

    if (!db) {
        console.error('数据库未初始化');
        return null;
    }

    const row = await db.getFirstAsync(
        `SELECT * FROM monthly_records WHERE id = ?`,
        [id]
    );
    return row ? parseJsonFields(row) : null;
}

export async function updateMonthlyRecord(id, data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const index = webStorage.data.monthly_records.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.monthly_records[index] = {
                ...webStorage.data.monthly_records[index],
                ...data,
                syncStatus: 'pending',
                updatedAt: now,
            };
            webStorage.save();
        }
        return;
    }

    await db.runAsync(
        `UPDATE monthly_records SET
      record_month = ?, visit_check = ?, meeting = ?, punishment = ?,
      position_stats = ?, notes = ?, syncStatus = 'pending', updatedAt = ?
    WHERE id = ?`,
        [
            data.record_month,
            JSON.stringify(data.visit_check || {}),
            JSON.stringify(data.meeting || {}),
            JSON.stringify(data.punishment || {}),
            JSON.stringify(data.position_stats || {}),
            data.notes || '',
            now, id
        ]
    );
}

export async function deleteMonthlyRecord(id) {
    if (isWeb) {
        const index = webStorage.data.monthly_records.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.monthly_records.splice(index, 1);
            webStorage.save();
        }
        return;
    }

    await db.runAsync(`DELETE FROM monthly_records WHERE id = ?`, [id]);
}

// ============ 及时检察操作 ============

export async function createImmediateEvent(data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const record = {
            id: webStorage.nextId('immediate_events'),
            user_id: 1,
            event_date: data.event_date,
            title: data.title || '',
            event_type: data.event_type,
            description: data.description || '',
            parole_data: data.parole_data || null,
            attachment_ids: data.attachment_ids || [],
            status: data.status || 'pending',
            syncStatus: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        webStorage.data.immediate_events.push(record);
        webStorage.save();
        return record.id;
    }

    const result = await db.runAsync(
        `INSERT INTO immediate_events (
      event_date, event_type, title, description, parole_data,
      attachment_ids, status, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.event_date,
            data.event_type,
            data.title || '',
            data.description || '',
            JSON.stringify(data.parole_data || null),
            JSON.stringify(data.attachment_ids || []),
            data.status || 'pending',
            now, now
        ]
    );

    const id = result.lastInsertRowId;
    return id;
}

export async function getImmediateEvents(limit = 50, offset = 0) {
    if (isWeb) {
        const sorted = [...webStorage.data.immediate_events].sort((a, b) =>
            new Date(b.event_date) - new Date(a.event_date)
        );
        return sorted.slice(offset, offset + limit);
    }

    if (!db) {
        console.error('数据库未初始化');
        return [];
    }

    const rows = await db.getAllAsync(
        `SELECT * FROM immediate_events ORDER BY event_date DESC LIMIT ? OFFSET ?`,
        [limit, offset]
    );
    return rows.map(parseJsonFields);
}

export async function getImmediateEventById(id) {
    if (isWeb) {
        return webStorage.data.immediate_events.find(r => r.id === id) || null;
    }

    if (!db) {
        console.error('数据库未初始化');
        return null;
    }

    const row = await db.getFirstAsync(
        `SELECT * FROM immediate_events WHERE id = ?`,
        [id]
    );
    return row ? parseJsonFields(row) : null;
}

export async function updateImmediateEvent(id, data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const index = webStorage.data.immediate_events.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.immediate_events[index] = {
                ...webStorage.data.immediate_events[index],
                ...data,
                syncStatus: 'pending',
                updatedAt: now,
            };
            webStorage.save();
        }
        return;
    }

    await db.runAsync(
        `UPDATE immediate_events SET
      event_date = ?, event_type = ?, title = ?, description = ?,
      parole_data = ?, attachment_ids = ?, status = ?,
      syncStatus = 'pending', updatedAt = ?
    WHERE id = ?`,
        [
            data.event_date,
            data.event_type,
            data.title || '',
            data.description || '',
            JSON.stringify(data.parole_data || null),
            JSON.stringify(data.attachment_ids || []),
            data.status || 'pending',
            now, id
        ]
    );
}

export async function deleteImmediateEvent(id) {
    if (isWeb) {
        const index = webStorage.data.immediate_events.findIndex(r => r.id === id);
        if (index >= 0) {
            webStorage.data.immediate_events.splice(index, 1);
            webStorage.save();
        }
        return;
    }

    await db.runAsync(`DELETE FROM immediate_events WHERE id = ?`, [id]);
}

// ============ 附件操作 ============

export async function createAttachment(data) {
    const now = new Date().toISOString();

    if (isWeb) {
        const record = {
            id: webStorage.nextId('attachments'),
            user_id: 1,
            ...data,
            syncStatus: 'pending',
            createdAt: now,
            updatedAt: now,
        };
        webStorage.data.attachments.push(record);
        webStorage.save();
        return record.id;
    }

    const result = await db.runAsync(
        `INSERT INTO attachments (
      category, original_name, file_name, file_path, file_size,
      mime_type, upload_month, related_log_id, related_log_type,
      createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.category,
            data.original_name,
            data.file_name,
            data.file_path,
            data.file_size || 0,
            data.mime_type || '',
            data.upload_month || new Date().toISOString().slice(0, 7),
            data.related_log_id || null,
            data.related_log_type || null,
            now, now
        ]
    );

    return result.lastInsertRowId;
}

// ============ 同步相关 ============

export async function getPendingSyncData() {
    if (isWeb) {
        return {
            daily_logs: webStorage.data.daily_logs.filter(r => r.syncStatus === 'pending'),
            weekly_records: webStorage.data.weekly_records.filter(r => r.syncStatus === 'pending'),
            monthly_records: webStorage.data.monthly_records.filter(r => r.syncStatus === 'pending'),
            immediate_events: webStorage.data.immediate_events.filter(r => r.syncStatus === 'pending'),
            attachments: webStorage.data.attachments.filter(r => r.syncStatus === 'pending'),
        };
    }

    const dailyLogs = await db.getAllAsync(`SELECT * FROM daily_logs WHERE syncStatus = 'pending'`);
    const weeklyRecords = await db.getAllAsync(`SELECT * FROM weekly_records WHERE syncStatus = 'pending'`);
    const monthlyRecords = await db.getAllAsync(`SELECT * FROM monthly_records WHERE syncStatus = 'pending'`);
    const immediateEvents = await db.getAllAsync(`SELECT * FROM immediate_events WHERE syncStatus = 'pending'`);
    const attachments = await db.getAllAsync(`SELECT * FROM attachments WHERE syncStatus = 'pending'`);

    return {
        daily_logs: dailyLogs.map(parseJsonFields),
        weekly_records: weeklyRecords.map(parseJsonFields),
        monthly_records: monthlyRecords.map(parseJsonFields),
        immediate_events: immediateEvents.map(parseJsonFields),
        attachments
    };
}

export async function markAsExported(tableName, ids) {
    if (ids.length === 0) return;

    if (isWeb) {
        ids.forEach(id => {
            const record = webStorage.data[tableName]?.find(r => r.id === id);
            if (record) record.syncStatus = 'exported';
        });
        webStorage.save();
        return;
    }

    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
        `UPDATE ${tableName} SET syncStatus = 'exported' WHERE id IN (${placeholders})`,
        ids
    );
}

export async function getPendingSyncCount() {
    if (isWeb) {
        return {
            daily: webStorage.data.daily_logs.filter(r => r.syncStatus === 'pending').length,
            weekly: webStorage.data.weekly_records.filter(r => r.syncStatus === 'pending').length,
            monthly: webStorage.data.monthly_records.filter(r => r.syncStatus === 'pending').length,
            immediate: webStorage.data.immediate_events.filter(r => r.syncStatus === 'pending').length,
            attachments: webStorage.data.attachments.filter(r => r.syncStatus === 'pending').length,
            get total() { return this.daily + this.weekly + this.monthly + this.immediate + this.attachments; }
        };
    }

    if (!db) {
        console.error('数据库未初始化');
        return { daily: 0, weekly: 0, monthly: 0, immediate: 0, attachments: 0, total: 0 };
    }

    const daily = await db.getFirstAsync(`SELECT COUNT(*) as count FROM daily_logs WHERE syncStatus = 'pending'`);
    const weekly = await db.getFirstAsync(`SELECT COUNT(*) as count FROM weekly_records WHERE syncStatus = 'pending'`);
    const monthly = await db.getFirstAsync(`SELECT COUNT(*) as count FROM monthly_records WHERE syncStatus = 'pending'`);
    const immediate = await db.getFirstAsync(`SELECT COUNT(*) as count FROM immediate_events WHERE syncStatus = 'pending'`);
    const attachments = await db.getFirstAsync(`SELECT COUNT(*) as count FROM attachments WHERE syncStatus = 'pending'`);

    return {
        daily: daily?.count || 0,
        weekly: weekly?.count || 0,
        monthly: monthly?.count || 0,
        immediate: immediate?.count || 0,
        attachments: attachments?.count || 0,
        total: (daily?.count || 0) + (weekly?.count || 0) + (monthly?.count || 0) +
            (immediate?.count || 0) + (attachments?.count || 0)
    };
}

// ============ 设置操作 ============

export async function getSetting(key) {
    if (isWeb) {
        return webStorage.data.settings[key] || null;
    }

    if (!db) {
        console.error('数据库未初始化');
        return null;
    }

    const row = await db.getFirstAsync(`SELECT value FROM settings WHERE key = ?`, [key]);
    return row?.value || null;
}

export async function setSetting(key, value) {
    if (isWeb) {
        webStorage.data.settings[key] = value;
        webStorage.save();
        return;
    }

    await db.runAsync(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value]);
}

// ============ 工具函数 ============

function parseJsonFields(row) {
    const jsonFields = [
        'three_scenes', 'strict_control', 'police_equipment', 'gang_prisoners',
        'admission', 'monitor_check', 'other_work', 'hospital_check', 'injury_check',
        'talk_records', 'mailbox', 'contraband', 'visit_check', 'meeting',
        'punishment', 'position_stats', 'parole_data', 'attachment_ids'
    ];

    const result = { ...row };
    for (const field of jsonFields) {
        if (result[field] && typeof result[field] === 'string') {
            try {
                result[field] = JSON.parse(result[field]);
            } catch (e) {
                // 保持原样
            }
        }
    }
    return result;
}

// 导出saveAttachment作为createAttachment的别名
export const saveAttachment = createAttachment;
