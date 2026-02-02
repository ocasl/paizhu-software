// 数据库Schema定义 - 与PC端MySQL完全一致
// 使用expo-sqlite

export const CREATE_TABLES_SQL = `
-- 日检察表
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

-- 周检察表
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

-- 月检察表
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

-- 及时检察表
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

-- 附件表
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

-- 用户设置表(本地)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);
`;

// 创建索引
export const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_weekly_records_date ON weekly_records(record_date);
CREATE INDEX IF NOT EXISTS idx_monthly_records_month ON monthly_records(record_month);
CREATE INDEX IF NOT EXISTS idx_immediate_events_date ON immediate_events(event_date);
CREATE INDEX IF NOT EXISTS idx_attachments_category ON attachments(category);
CREATE INDEX IF NOT EXISTS idx_sync_status_daily ON daily_logs(syncStatus);
CREATE INDEX IF NOT EXISTS idx_sync_status_weekly ON weekly_records(syncStatus);
CREATE INDEX IF NOT EXISTS idx_sync_status_monthly ON monthly_records(syncStatus);
CREATE INDEX IF NOT EXISTS idx_sync_status_immediate ON immediate_events(syncStatus);
CREATE INDEX IF NOT EXISTS idx_sync_status_attachments ON attachments(syncStatus);
`;
