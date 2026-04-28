-- Cloud-Mail D1 数据库 Schema
-- 用于存储多账号邮件和地址管理

CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  sender TEXT NOT NULL,
  subject TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  raw_email TEXT DEFAULT '',
  received_at INTEGER NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at DESC);

CREATE TABLE IF NOT EXISTS addresses (
  address TEXT PRIMARY KEY,
  label TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  active INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_addresses_active ON addresses(active);
CREATE INDEX IF NOT EXISTS idx_addresses_created ON addresses(created_at DESC);

-- 插入默认的管理地址
INSERT OR IGNORE INTO addresses (address, label, notes) VALUES ('admin@neumabio.xyz', '管理员', 'Admin mailbox');
