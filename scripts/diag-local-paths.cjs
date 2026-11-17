// 诊断所有 localPath 找不到的 case
// 对每条 missing，在父目录里看真实子目录/文件，对比差异

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || '/data/inspiration.db';
const db = new DatabaseSync(DB_PATH);
const rows = db.prepare("SELECT id, data FROM inspirations WHERE data LIKE '%localPath%'").all();

function basename(p) {
  return p.split('/').pop();
}
function dirname(p) {
  const parts = p.split('/');
  parts.pop();
  return parts.join('/');
}

// 字符级 diff
function diffStrings(a, b) {
  const out = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      out.push(`'${a[i] || ''}' vs '${b[i] || ''}' @ pos ${i}`);
    }
  }
  return out.slice(0, 3);
}

const missing = [];
for (const row of rows) {
  let obj; try { obj = JSON.parse(row.data); } catch { continue; }
  if (!obj.localPath) continue;
  if (fs.existsSync(obj.localPath)) continue;
  missing.push({ id: row.id, localPath: obj.localPath });
}

console.log(`找不到 ${missing.length} 条，逐条诊断:\n`);

for (const m of missing) {
  const p = m.localPath;
  const dir = dirname(p);
  const file = basename(p);

  console.log(`━━━ ${m.id} ━━━`);
  console.log(`  path: ${p}`);

  // 1) 父目录存在吗？
  if (!fs.existsSync(dir)) {
    console.log(`  ❌ 父目录不存在: ${dir}`);

    // 尝试往上找祖先目录
    let cur = dir;
    for (let i = 0; i < 5; i++) {
      cur = dirname(cur);
      if (fs.existsSync(cur)) {
        console.log(`     → 但 ${cur} 存在（往上 ${i+1} 层）`);
        // 列这个存在的祖先目录下有什么相关目录
        try {
          const entries = fs.readdirSync(cur).filter(e => !e.startsWith('.'));
          const matched = entries.filter(e => e.includes(file.slice(0, 10)) || e.includes(p.split('/').slice(-2, -1)[0]?.slice(0, 5) || ''));
          if (matched.length) {
            console.log(`     候选: ${matched.slice(0, 3).join(' | ')}`);
          } else {
            console.log(`     目录里有 ${entries.length} 项（没明显匹配）`);
          }
        } catch {}
        break;
      }
    }
  } else {
    // 2) 父目录存在但文件不在
    console.log(`  ✓ 父目录存在`);
    try {
      const entries = fs.readdirSync(dir);
      const exact = entries.find(e => e === file);
      const fuzzy = entries.filter(e =>
        e.toLowerCase() === file.toLowerCase() ||
        e.replace(/[:·]/g, '_') === file.replace(/[:·]/g, '_')
      );
      if (exact) {
        console.log(`  🎯 找到了！exact match: ${exact}`);
      } else if (fuzzy.length) {
        console.log(`  🔍 近似: ${fuzzy.join(' | ')}`);
        fuzzy.forEach(f => {
          if (f !== file) console.log(`     diff: ${diffStrings(file, f).join('; ')}`);
        });
      } else {
        // 列几个相邻的
        console.log(`  📁 父目录有 ${entries.length} 项，前 5 个:`);
        entries.slice(0, 5).forEach(e => console.log(`     - ${e}`));
      }
    } catch (e) {
      console.log(`  ❌ 列父目录失败: ${e.message}`);
    }
  }
  console.log('');
}

db.close();
