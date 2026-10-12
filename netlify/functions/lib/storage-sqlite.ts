// netlify/functions/lib/storage-sqlite.ts
// SQLite + 阿里云 OSS 后端（用于自建服务器）
// 数据：SQLite 文件（用 Node 22 内置的 node:sqlite，无需 native binding）
// 图片：根据 IMAGE_BACKEND 走本地或阿里云 OSS

// node:sqlite 是 Node 22.5+ 内置模块，无需安装 native binding
// API 参考：https://nodejs.org/api/sqlite.html
const { DatabaseSync }: any = require('node:sqlite');
import * as path from 'path';
import * as fs from 'fs';
import { DataStore, DEFAULT_DATA, Inspiration } from './types';

// ============ 配置 ============
const DB_PATH = process.env.DB_PATH || path.join(process.env.DATA_DIR || '/data', 'inspiration.db');
const IMAGE_BACKEND = process.env.IMAGE_BACKEND || 'local';
const IMAGE_DIR = process.env.IMAGE_DIR || path.join(process.env.DATA_DIR || '/data', 'images');

// ============ SQLite 初始化 ============
let _db: any = null;
function getDB(): any {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new DatabaseSync(DB_PATH);
  // node:sqlite 默认是 WAL 模式，性能 OK

  _db.exec(`
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

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS venueTypes (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS userFeedbacks (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON userFeedbacks(createdAt);
  `);

  console.log(`[storage-sqlite] ✓ DB 初始化: ${DB_PATH}`);
  return _db;
}

// ============ 图片后端（local | oss）============
let _ossClient: any = null;
async function getOssClient() {
  if (_ossClient !== null) return _ossClient;
  if (IMAGE_BACKEND !== 'oss') return null;
  try {
    const OSS = require('ali-oss');
    _ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET,
    });
    console.log(`[storage-sqlite] ✓ OSS 客户端初始化 (bucket: ${process.env.OSS_BUCKET})`);
    return _ossClient;
  } catch (e: any) {
    console.error('[storage-sqlite] ✗ OSS 初始化失败:', e.message);
    return null;
  }
}

async function readImageRaw(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (IMAGE_BACKEND === 'oss') {
    const client = await getOssClient();
    if (!client) return null;
    try {
      const result = await client.get(key);
      return {
        buffer: result.content as Buffer,
        contentType: (result.res?.headers?.['content-type'] as string) || 'image/jpeg',
      };
    } catch (e: any) {
      if (e.code === 'NoSuchKey') return null;
      throw e;
    }
  }

  const filePath = path.join(IMAGE_DIR, key);
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  const metaPath = filePath + '.meta';
  let contentType = 'image/jpeg';
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.contentType) contentType = meta.contentType;
    } catch {}
  }
  return { buffer, contentType };
}

async function writeImageRaw(key: string, buffer: Buffer, contentType: string): Promise<void> {
  if (IMAGE_BACKEND === 'oss') {
    const client = await getOssClient();
    if (!client) throw new Error('OSS 客户端不可用');
    await client.put(key, buffer, {
      headers: { 'Content-Type': contentType },
    });
    return;
  }

  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.writeFileSync(path.join(IMAGE_DIR, key), buffer);
  fs.writeFileSync(path.join(IMAGE_DIR, key + '.meta'), JSON.stringify({ contentType }));
}

async function deleteImageRaw(key: string): Promise<void> {
  if (IMAGE_BACKEND === 'oss') {
    const client = await getOssClient();
    if (!client) return;
    try { await client.delete(key); } catch {}
    return;
  }
  const filePath = path.join(IMAGE_DIR, key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const metaPath = filePath + '.meta';
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
}

// ============ 数据存储 API ============
const SETTINGS_KEY = 'main';

export async function loadData(): Promise<DataStore> {
  const db = getDB();
  const insps = db.prepare('SELECT data FROM inspirations').all() as { data: string }[];
  const cats = db.prepare('SELECT data FROM categories').all() as { data: string }[];
  const venues = db.prepare('SELECT data FROM venueTypes').all() as { data: string }[];
  const settingsRow = db.prepare('SELECT value FROM settings WHERE key = ?').get(SETTINGS_KEY) as { value: string } | undefined;
  const feedbacks = db.prepare('SELECT data FROM userFeedbacks').all() as { data: string }[];

  const inspirations: Record<string, Inspiration> = {};
  for (const row of insps) {
    try {
      const obj = JSON.parse(row.data);
      inspirations[obj.id] = obj;
    } catch {}
  }
  const categories = cats.map(r => JSON.parse(r.data));
  const venueTypes = venues.map(r => JSON.parse(r.data));
  const userFeedbacks = feedbacks.map(r => JSON.parse(r.data));
  const settings = settingsRow ? JSON.parse(settingsRow.value) : {};

  const existingCatIds = new Set(categories.map((c: any) => c.id));
  const mergedCategories = [
    ...categories,
    ...DEFAULT_DATA.categories.filter(c => !existingCatIds.has(c.id)),
  ];
  const existingVenueIds = new Set(venueTypes.map((v: any) => v.id));
  const mergedVenueTypes = [
    ...venueTypes,
    ...DEFAULT_DATA.venueTypes.filter(v => !existingVenueIds.has(v.id)),
  ];

  return {
    inspirations,
    categories: mergedCategories,
    venueTypes: mergedVenueTypes,
    userFeedbacks,
    settings,
  };
}

export async function saveData(data: DataStore): Promise<void> {
  const db = getDB();

  // node:sqlite 的 transaction 写法
  const tx = db.exec.bind(db);
  // 先全删
  db.exec('DELETE FROM inspirations; DELETE FROM categories; DELETE FROM venueTypes;');

  const insStmt = db.prepare(`
    INSERT INTO inspirations (id, data, url, title, status, venueType, platform, createdAt, updatedAt, confirmedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const insp of Object.values(data.inspirations)) {
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
  }

  const catStmt = db.prepare('INSERT INTO categories (id, data) VALUES (?, ?)');
  for (const c of data.categories) catStmt.run(c.id, JSON.stringify(c));

  const venStmt = db.prepare('INSERT INTO venueTypes (id, data) VALUES (?, ?)');
  for (const v of data.venueTypes) venStmt.run(v.id, JSON.stringify(v));

  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(SETTINGS_KEY, JSON.stringify(data.settings || {}));
}

export async function addInspiration(insp: Inspiration): Promise<void> {
  const data = await loadData();
  data.inspirations[insp.id] = insp;
  await saveData(data);
}

export async function updateInspiration(id: string, patch: Partial<Inspiration>): Promise<Inspiration | null> {
  const data = await loadData();
  const existing = data.inspirations[id];
  if (!existing) return null;
  const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
  data.inspirations[id] = updated;
  await saveData(data);
  return updated;
}

export async function deleteInspiration(id: string): Promise<boolean> {
  const data = await loadData();
  if (!data.inspirations[id]) return false;
  delete data.inspirations[id];
  await saveData(data);
  await deleteImageRaw(`${id}.jpg`);
  await deleteImageRaw(`${id}.thumb.jpg`);
  return true;
}

export async function findByUrl(url: string): Promise<Inspiration | null> {
  const data = await loadData();
  return Object.values(data.inspirations).find(i => i.url === url) || null;
}

export async function listInspirations(filter?: {
  subCategory?: string;
  venueType?: string;
  status?: string;
  platform?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Inspiration[]> {
  const data = await loadData();
  let list = Object.values(data.inspirations);

  if (filter?.subCategory) {
    const target = filter.subCategory;
    list = list.filter(i => {
      if (Array.isArray(i.subCategories) && i.subCategories.length > 0) {
        return i.subCategories.includes(target);
      }
      return (i as any).subCategory === target;
    });
  }
  if (filter?.venueType) list = list.filter(i => i.venueType === filter.venueType);
  if (filter?.status) list = list.filter(i => i.status === filter.status);
  if (filter?.platform) list = list.filter(i => i.platform === filter.platform);
  if (filter?.startDate || filter?.endDate) {
    const start = filter?.startDate || '';
    const end = filter?.endDate || '';
    list = list.filter(i => {
      const d = (i.createdAt || '').slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }
  if (filter?.keyword) {
    const k = filter.keyword.toLowerCase();
    list = list.filter(i => {
      if ((i.title || '').toLowerCase().includes(k)) return true;
      if ((i.description || '').toLowerCase().includes(k)) return true;
      if ((i.tags || []).some(t => t.toLowerCase().includes(k))) return true;
      if ((i.userNote || '').toLowerCase().includes(k)) return true;
      if ((i.visualDescription || '').toLowerCase().includes(k)) return true;
      if ((i.aiSuggestion?.visualDescription || '').toLowerCase().includes(k)) return true;
      const allTags = [...(i.visualTags || []), ...(i.aiSuggestion?.visualTags || [])];
      if (allTags.some(t => t.toLowerCase().includes(k))) return true;
      return false;
    });
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ============ 图片 API ============
export async function saveImage(inspirationId: string, imageBuffer: Buffer, contentType: string): Promise<string> {
  await writeImageRaw(`${inspirationId}.jpg`, imageBuffer, contentType);
  return `${inspirationId}.jpg`;
}

export async function getImage(inspirationId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  return readImageRaw(`${inspirationId}.jpg`);
}

export function getImageStore() {
  return {
    get: async (key: string, opts?: { type?: string }) => {
      const result = await readImageRaw(key);
      if (!result) return null;
      if (opts?.type === 'arrayBuffer') {
        return result.buffer.buffer.slice(
          result.buffer.byteOffset,
          result.buffer.byteOffset + result.buffer.byteLength
        );
      }
      return result.buffer;
    },
    set: async (key: string, value: Buffer, opts?: { metadata?: { contentType?: string } }) => {
      await writeImageRaw(key, value, opts?.metadata?.contentType || 'image/jpeg');
    },
    getMetadata: async (key: string) => {
      if (IMAGE_BACKEND === 'oss') {
        const client = await getOssClient();
        if (!client) return null;
        try {
          const head = await client.head(key);
          return { metadata: { contentType: head.res?.headers?.['content-type'] } };
        } catch {
          return null;
        }
      }
      const metaPath = path.join(IMAGE_DIR, key + '.meta');
      if (!fs.existsSync(metaPath)) return null;
      try {
        return { metadata: JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
      } catch {
        return null;
      }
    },
  };
}

export function setNetlifyContext(_ctx: any) {
  // no-op（保留 API 兼容）
}
