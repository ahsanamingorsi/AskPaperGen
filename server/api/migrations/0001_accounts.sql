PRAGMA foreign_keys = ON;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0 CHECK(points >= 0),
  created_at INTEGER NOT NULL
);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at INTEGER NOT NULL
);
CREATE TABLE login_challenges (
  id TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  method TEXT NOT NULL CHECK(method IN ('jazzcash','easypaisa')),
  transaction_reference TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  package_id TEXT NOT NULL,
  amount_pkr INTEGER NOT NULL CHECK(amount_pkr > 0),
  points INTEGER NOT NULL CHECK(points > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by TEXT REFERENCES users(id),
  review_note TEXT NOT NULL DEFAULT '',
  UNIQUE(method,transaction_reference)
);
CREATE TABLE exports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  request_id TEXT NOT NULL,
  paper_hash TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('pdf','json')),
  cost INTEGER NOT NULL CHECK(cost > 0),
  status TEXT NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','ready','failed')),
  created_at INTEGER NOT NULL,
  UNIQUE(user_id,request_id)
);
CREATE TABLE point_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL CHECK(delta != 0),
  kind TEXT NOT NULL CHECK(kind IN ('purchase','export','refund')),
  source TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE TRIGGER apply_points AFTER INSERT ON point_ledger BEGIN
  UPDATE users SET points = points + NEW.delta WHERE id = NEW.user_id;
END;
CREATE TRIGGER approve_payment AFTER UPDATE OF status ON payment_requests
WHEN OLD.status = 'pending' AND NEW.status = 'approved' BEGIN
  INSERT INTO point_ledger(user_id,delta,kind,source,created_at)
  VALUES(NEW.user_id,NEW.points,'purchase','payment:'||NEW.id,NEW.reviewed_at);
END;
CREATE TRIGGER reserve_export AFTER INSERT ON exports BEGIN
  INSERT INTO point_ledger(user_id,delta,kind,source,created_at)
  VALUES(NEW.user_id,-NEW.cost,'export','export:'||NEW.id,NEW.created_at);
END;
CREATE TRIGGER refund_export AFTER UPDATE OF status ON exports
WHEN OLD.status = 'processing' AND NEW.status = 'failed' BEGIN
  INSERT INTO point_ledger(user_id,delta,kind,source,created_at)
  VALUES(NEW.user_id,NEW.cost,'refund','refund:'||NEW.id,unixepoch());
END;
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE INDEX payments_user ON payment_requests(user_id,created_at);
CREATE INDEX exports_pending ON exports(status,created_at);
CREATE INDEX ledger_user ON point_ledger(user_id,created_at);
