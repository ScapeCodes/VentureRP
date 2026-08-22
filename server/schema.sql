CREATE TABLE IF NOT EXISTS content (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection, id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_json TEXT NOT NULL,
  roles_json TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  return_to TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_collection ON content(collection);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS queue_entries (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'ready')),
  joined_at INTEGER NOT NULL,
  heartbeat_at INTEGER NOT NULL,
  ready_at INTEGER,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_queue_order ON queue_entries(status, joined_at);
CREATE INDEX IF NOT EXISTS idx_queue_expiry ON queue_entries(status, heartbeat_at, expires_at);
