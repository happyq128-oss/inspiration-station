// scripts/build-functions.js
// 用 esbuild 把 netlify/functions/*.ts 编译成 dist/functions/*.js
// 部署到 ECS 时由 deploy.sh 调用

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'netlify/functions');
const OUT = path.join(ROOT, 'dist/functions');

// 需要打包的 endpoint（排除 scheduled-backup / health-check，由 Express 处理）
const ENTRYPOINTS = [
  'add-inspiration',
  'ai-classify',
  'backfill-thumbnails',
  'backfill-visual-desc',
  'backup-data',
  'batch-classify',
  'batch-confirm',
  'delete-inspiration',
  'export-excel',
  'feedback',
  'get-image',
  'get-stats',
  'index-local-image',
  'list-inspirations',
  'manage-categories',
  'reset-bad-status',
  'reset-rules',
  'scrape-page',
  'search-by-description',
  'update-inspiration',
];

// 排除的（不需要）
const EXCLUDED = [
  'scheduled-backup',  // 定时备份：服务器用 cron 替代
  'health-check',      // 由 server/index.js 自带
  'env-debug',         // 调试用
];

async function main() {
  // 1) 先打包 lib/*.ts 成共享 chunk（避免 22 个文件重复打包）
  // esbuild 默认每个 entry 自带 lib 代码——这里我们接受 22 个文件各有自己的 lib 副本（简单）

  fs.mkdirSync(OUT, { recursive: true });

  const entryPoints = ENTRYPOINTS.map(name => path.join(SRC, `${name}.ts`));

  console.log(`[build] 编译 ${ENTRYPOINTS.length} 个 endpoint → ${OUT}`);
  const t0 = Date.now();

  await esbuild.build({
    entryPoints,
    outdir: OUT,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    sourcemap: false,
    minify: false,  // 保留可读性，方便排查
    logLevel: 'info',
    external: [
      // 这些是 native/动态加载的，外部化
      'sharp',
      'ali-oss',
      '@netlify/blobs',  // 留作 fallback（如果用户想保留 Blobs）
      '@netlify/functions',
    ],
  });

  console.log(`[build] ✓ 完成，用时 ${Date.now() - t0}ms`);
  console.log(`[build] 输出目录：${OUT}`);
  console.log(`[build] 文件列表：`);
  fs.readdirSync(OUT).filter(f => f.endsWith('.js')).forEach(f => {
    const stat = fs.statSync(path.join(OUT, f));
    console.log(`   ${f}  (${(stat.size / 1024).toFixed(1)} KB)`);
  });
}

main().catch(e => {
  console.error('[build] FAILED:', e);
  process.exit(1);
});
