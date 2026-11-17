// 一次性迁移脚本：把 Netlify 备份的 data.json 灌到 ECS 的 SQLite
// 用法：node migrate-from-netlify.cjs <data.json 路径>

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dataPath = process.argv[2] || '/tmp/netlify-export/data.json';
const DB_PATH = process.env.DB_PATH || '/data/inspiration.db';

if (!fs.existsSync(dataPath)) {
  console.error(`❌ data.json 不存在: ${dataPath}`);
  process.exit(1);
}

console.log(`📂 读 ${dataPath} ...`);
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const items = data.inspirations || {};
const categories = data.categories || [];
const venueTypes = data.venueTypes || [];
const settings = data.settings || {};
const userFeedbacks = data.userFeedbacks || [];

console.log(`   ${Object.keys(items).length} 条灵感`);
console.log(`   ${categories.length} 个分类`);
console.log(`   ${venueTypes.length} 个场馆类型`);
console.log(`   ${userFeedbacks.length} 条用户反馈`);

const db = new DatabaseSync(DB_PATH);

console.log(`\n🔨 重建表 ...`);
db.exec(`
  CREATE TABLE IF NOT EXISTS inspirations (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    url TEXT,
    title TEXT,
    status TEXT DEFAULT 'pending',
    venueType TEXT,
    platform TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    confirmedAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_insp_status ON inspirations(status);
  CREATE INDEX IF NOT EXISTS idx_insp_venue ON inspirations(venueType);
  CREATE INDEX IF NOT EXISTS idx_insp_created ON inspirations(createdAt);

  CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS venueTypes (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS userFeedbacks (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    createdAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_feedback_created ON userFeedbacks(createdAt);
`);

// 用 transaction 加速
console.log(`\n💾 写入数据 ...`);
db.exec('BEGIN');
try {
  db.exec('DELETE FROM inspirations; DELETE FROM categories; DELETE FROM venueTypes; DELETE FROM userFeedbacks;');

  const insStmt = db.prepare(`
    INSERT INTO inspirations (id, data, url, title, status, venueType, platform, createdAt, updatedAt, confirmedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let insCount = 0;
  for (const insp of Object.values(items)) {
    insStmt.run(
      insp.id,
      JSON.stringify(insp),
      insp.url || null,
      insp.title || null,
      insp.status || null,
      insp.venueType || null,
      insp.platform || null,
      insp.createdAt || null,
      insp.updatedAt || null,
      insp.confirmedAt || null,
    );
    insCount++;
  }

  const catStmt = db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)');
  for (const c of categories) catStmt.run(c.id, JSON.stringify(c));

  const venStmt = db.prepare('INSERT INTO venueTypes (id, data) VALUES (?, ?)');
  for (const v of venueTypes) venStmt.run(v.id, JSON.stringify(v));

  const fbStmt = db.prepare('INSERT INTO userFeedbacks (id, data, createdAt) VALUES (?, ?, ?)');
  for (const f of userFeedbacks) fbStmt.run(f.id, JSON.stringify(f), f.createdAt || null);

  db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .run('main', JSON.stringify(settings));

  db.exec('COMMIT');
  console.log(`   ✓ 灵感 ${insCount} 条`);
  console.log(`   ✓ 分类 ${categories.length} 个`);
  console.log(`   ✓ 场馆 ${venueTypes.length} 个`);
  console.log(`   ✓ 反馈 ${userFeedbacks.length} 条`);
} catch (e) {
  db.exec('ROLLBACK');
  console.error('❌ 写入失败:', e.message);
  process.exit(1);
}

// 校验
const cnt = db.prepare('SELECT COUNT(*) as c FROM inspirations').get();
console.log(`\n✅ DB 现共 ${cnt.c} 条灵感`);

db.close();
console.log('🎉 迁移完成');
