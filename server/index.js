// server/index.js
// Express 服务器入口
// 把所有 Netlify Functions 包成 Express 路由
// 数据存储后端由 DATA_BACKEND 环境变量决定（sqlite | blobs）

const express = require('express');
const path = require('path');
const fs = require('fs');
const { netlifyToExpress } = require('./adapter');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist/functions');

// 加载编译后的 handlers
const handlers = {};
const handlerFiles = fs.readdirSync(DIST).filter(f => f.endsWith('.js'));
for (const file of handlerFiles) {
  const name = file.replace(/\.js$/, '');
  try {
    handlers[name] = require(path.join(DIST, file)).handler;
  } catch (e) {
    console.error(`[server] 无法加载 handler ${name}:`, e.message);
  }
}
console.log(`[server] 已加载 ${Object.keys(handlers).length} 个 handler`);

const app = express();

// ============ 中间件 ============

// 信任 Nginx 反向代理（这样 req.ip / X-Forwarded-For 才准）
app.set('trust proxy', 1);

// 解析 body（图片 base64 可能很大，给 25MB 限制）
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 请求日志（开发用，生产可关）
if (process.env.LOG_REQUESTS === '1') {
  app.use((req, res, next) => {
    console.log(`[req] ${req.method} ${req.path}`);
    next();
  });
}

// ============ API 路由 ============

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'inspiration-station',
    ts: Date.now(),
    uptime: process.uptime(),
    handlers: Object.keys(handlers).length,
    backend: process.env.DATA_BACKEND || 'blobs',
  });
});

// API 路由表
const API_ROUTES = [
  ['GET',  '/api/list',                'list-inspirations'],
  ['POST', '/api/add',                 'add-inspiration'],
  ['POST', '/api/update',              'update-inspiration'],
  ['POST', '/api/delete',              'delete-inspiration'],
  ['POST', '/api/ai-classify',         'ai-classify'],
  ['POST', '/api/batch-classify',      'batch-classify'],
  ['POST', '/api/scrape',              'scrape-page'],
  ['GET',  '/api/stats',               'get-stats'],
  ['POST', '/api/categories',          'manage-categories'],
  ['GET',  '/api/categories',          'manage-categories'],
  ['GET',  '/api/export',              'export-excel'],
  ['GET',  '/api/backup',              'backup-data'],
  ['POST', '/api/backup',              'backup-data'],
  ['POST', '/api/reset-bad-status',    'reset-bad-status'],
  ['POST', '/api/reset-rules',         'reset-rules'],
  ['POST', '/api/search-by-description', 'search-by-description'],
  ['POST', '/api/backfill-visual-desc',  'backfill-visual-desc'],
  ['POST', '/api/backfill-thumbnails',    'backfill-thumbnails'],
  ['POST', '/api/index-local-image',     'index-local-image'],
  ['POST', '/api/feedback',              'feedback'],
  ['POST', '/api/batch-confirm',         'batch-confirm'],
  ['GET',  '/api/image/:id',             'get-image'],
];

let registered = 0;
for (const [method, path, handlerName] of API_ROUTES) {
  if (!handlers[handlerName]) {
    console.warn(`[server] ⚠️  跳过 ${method} ${path}：handler ${handlerName} 未找到`);
    continue;
  }
  app[method.toLowerCase()](path, netlifyToExpress(handlers[handlerName]));
  registered++;
}
console.log(`[server] 已注册 ${registered} 条 API 路由`);

// ============ 静态文件（前端） ============

const SRC = path.join(ROOT, 'src');
app.use(express.static(SRC, { maxAge: '1h' }));

// SPA fallback：所有非 /api 路径都返回对应 HTML
app.get(/^\/(?!api\/).*/, (req, res) => {
  // 简单的 HTML 路由
  const routeMap = {
    '/': 'index.html',
    '/inspirations': 'pages/inspirations.html',
    '/find': 'pages/find.html',
    '/confirm': 'pages/confirm.html',
    '/confirm-batch': 'pages/confirm-batch.html',
    '/settings': 'pages/settings.html',
  };
  const file = routeMap[req.path] || 'index.html';
  res.sendFile(path.join(SRC, file), err => {
    if (err) res.status(404).send('Not found: ' + req.path);
  });
});

// ============ 错误处理 ============
app.use((err, req, res, next) => {
  console.error('[server] 未捕获错误:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: err.message || 'Internal error' });
});

// ============ 启动 ============
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('════════════════════════════════════════════');
  console.log(`  灵感站服务已启动`);
  console.log(`  端口：${PORT}`);
  console.log(`  数据后端：${process.env.DATA_BACKEND || 'blobs'}`);
  console.log(`  数据目录：${process.env.DATA_DIR || '(默认)'}`);
  console.log(`  图片后端：${process.env.IMAGE_BACKEND || 'local'}`);
  console.log(`  访问：http://localhost:${PORT}`);
  console.log('════════════════════════════════════════════');
});
