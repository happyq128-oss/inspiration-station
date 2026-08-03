// netlify/functions/lib/storage.ts
// Netlify Blobs 数据层封装

import { getStore } from '@netlify/blobs';
import { DataStore, DEFAULT_DATA, Inspiration } from './types';

const STORE_NAME = 'inspiration-store';
const KEY = 'data-v1';
const IMAGE_STORE_NAME = 'inspiration-images';

function getStoreOptions(name: string) {
  // 关键：在 Netlify Functions 部署时，会自动注入 SITE_ID（Netlify 保留字）
  // 此时必须用自动注入的 siteID + 内部 token（不能用 .env 里的，否则 401）
  // 本地 dev 时 SITE_ID 不存在，用 .env 里的 MY_SITE_ID + NETLIFY_BLOBS_TOKEN
  const isNetlifyDeploy = !!process.env.SITE_ID || !!process.env.NETLIFY;

  if (isNetlifyDeploy) {
    // Netlify 部署：让 Netlify 自己注入 context
    return getStore(name);
  }

  // 本地 dev：用 .env 里的显式凭证
  const siteID = process.env.MY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({
      name,
      siteID,
      token,
    } as any);
  }
  // 兜底：默认模式
  return getStore(name);
}

function getDataStore() {
  return getStoreOptions(STORE_NAME);
}

function getImageStore() {
  return getStoreOptions(IMAGE_STORE_NAME);
}

export async function saveImage(inspirationId: string, imageBuffer: Buffer, contentType: string): Promise<string> {
  const store = getImageStore();
  const key = `${inspirationId}.jpg`;
  await store.set(key, imageBuffer, {
    metadata: { contentType },
  });
  return key;
}

export async function getImage(inspirationId: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const store = getImageStore();
    const key = `${inspirationId}.jpg`;
    // 先用普通 get（saveImage 验证时 OK）
    const value = await store.get(key, { type: 'arrayBuffer' });
    if (!value) return null;
    // 再尝试获取 metadata
    let contentType = 'image/jpeg';
    try {
      const meta = await store.getMetadata(key);
      if (meta?.metadata?.contentType) contentType = meta.metadata.contentType;
    } catch {
      // metadata 失败无所谓
    }
    return {
      buffer: Buffer.from(value as ArrayBuffer),
      contentType,
    };
  } catch (e) {
    console.error(`[getImage] error:`, e);
    return null;
  }
}

export async function loadData(): Promise<DataStore> {
  const store = getDataStore();
  try {
    const data = (await store.get(KEY, { type: 'json' })) as DataStore | null;
    if (!data) {
      await saveData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    // 数据迁移：补全缺失的小类（不覆盖用户已有的）
    const existingCatIds = new Set((data.categories || []).map(c => c.id));
    const mergedCategories = [
      ...(data.categories || []),
      ...DEFAULT_DATA.categories.filter(c => !existingCatIds.has(c.id)),
    ];
    const existingVenueIds = new Set((data.venueTypes || []).map(v => v.id));
    const mergedVenueTypes = [
      ...(data.venueTypes || []),
      ...DEFAULT_DATA.venueTypes.filter(v => !existingVenueIds.has(v.id)),
    ];
    return {
      inspirations: data.inspirations || {},
      categories: mergedCategories,
      venueTypes: mergedVenueTypes,
      settings: data.settings || {},
    };
  } catch (e) {
    console.error('Load data error:', e);
    return DEFAULT_DATA;
  }
}

export async function saveData(data: DataStore): Promise<void> {
  const store = getDataStore();
  await store.setJSON(KEY, data);
}

// 单条灵感的便捷操作
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
}): Promise<Inspiration[]> {
  const data = await loadData();
  let list = Object.values(data.inspirations);

  if (filter?.subCategory) list = list.filter(i => i.subCategory === filter.subCategory);
  if (filter?.venueType) list = list.filter(i => i.venueType === filter.venueType);
  if (filter?.status) list = list.filter(i => i.status === filter.status);
  if (filter?.platform) list = list.filter(i => i.platform === filter.platform);
  if (filter?.keyword) {
    const k = filter.keyword.toLowerCase();
    list = list.filter(i =>
      (i.title || '').toLowerCase().includes(k) ||
      (i.description || '').toLowerCase().includes(k) ||
      (i.userNote || '').toLowerCase().includes(k) ||
      (i.tags || []).some(t => t.toLowerCase().includes(k))
    );
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
