// 修复 ECS 上 localPath 字符差异问题
// V2：加上"按 basename 在父目录模糊搜"和"清理重复错误字符"的回退

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || '/data/inspiration.db';
const db = new DatabaseSync(DB_PATH);

const rows = db.prepare("SELECT id, data FROM inspirations WHERE data LIKE '%localPath%'").all();
console.log(`检查 ${rows.length} 条带 localPath 的灵感\n`);

function dirname(p) { return p.split('/').slice(0, -1).join('/'); }
function basename(p) { return p.split('/').pop(); }

function tryCharVariants(p) {
  if (!p) return [];
  return [...new Set([
    p,
    p.replace(/·/g, '_'),
    p.replace(/:/g, '_'),
    p.replace(/：/g, '_'),
    p.replace(/,/g, '_'),
    p.replace(/，/g, '_'),
    p.replace(/\s/g, '_'),
    p.replace(/（/g, '(').replace(/）/g, ')'),
    p.replace(/\(/g, '（').replace(/\)/g, '）'),
    p.replace(/[·:：，,\s]/g, '_'),
  ])];
}

function tryBasenameFuzzy(localPath) {
  // 在父目录的子目录里找匹配的（去掉一层）
  // 适用：路径写多了一层 / 子目录改名了
  const dir = dirname(localPath);
  const file = basename(localPath);
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir);
  // 1) 完全匹配（无论大小写）
  const exact = entries.find(e => e === file);
  if (exact) return path.join(dir, exact);
  // 2) 大小写不敏感
  const ci = entries.find(e => e.toLowerCase() === file.toLowerCase());
  if (ci) return path.join(dir, ci);
  return null;
}

let fixed = 0, alreadyOk = 0, noLocalPath = 0, stillMissing = 0;
const examples = { fixed: [], stillMissing: [] };

for (const row of rows) {
  let obj;
  try { obj = JSON.parse(row.data); } catch { continue; }
  const localPath = obj.localPath;
  if (!localPath) { noLocalPath++; continue; }
  if (fs.existsSync(localPath)) { alreadyOk++; continue; }

  // 先字符替换
  let found = tryCharVariants(localPath).find(v => v !== localPath && fs.existsSync(v));
  let strategy = 'char-variant';
  // 再 basename 模糊匹配（仅当父目录存在时）
  if (!found) {
    found = tryBasenameFuzzy(localPath);
    strategy = 'basename-fuzzy';
  }

  if (found) {
    obj.localPath = found;
    obj.updatedAt = new Date().toISOString();
    db.prepare('UPDATE inspirations SET data = ?, updatedAt = ? WHERE id = ?')
      .run(JSON.stringify(obj), obj.updatedAt, row.id);
    fixed++;
    if (examples.fixed.length < 8) {
      examples.fixed.push({ id: row.id, from: localPath, to: found, strategy });
    }
  } else {
    stillMissing++;
    if (examples.stillMissing.length < 5) {
      examples.stillMissing.push({ id: row.id, path: localPath });
    }
  }
}

console.log(`✅ 原本就 ok:        ${alreadyOk}`);
console.log(`🔧 修正:            ${fixed}`);
console.log(`❌ 还是找不到:      ${stillMissing}`);
console.log(`ℹ️  没有 localPath:  ${noLocalPath}\n`);

if (examples.fixed.length) {
  console.log('=== 修正示例 ===');
  examples.fixed.forEach(e => {
    console.log(`  [${e.strategy}] ${e.id}`);
    console.log(`    FROM: ${e.from.slice(0, 100)}`);
    console.log(`    TO:   ${e.to.slice(0, 100)}`);
    console.log('');
  });
}
if (examples.stillMissing.length) {
  console.log('=== 还是找不到（需手动处理）===');
  examples.stillMissing.forEach(e => {
    console.log(`  ${e.id}: ${e.path.slice(0, 120)}`);
  });
}

db.close();
