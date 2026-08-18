// netlify/functions/lib/storage.ts
// Netlify Blobs 数据层封装

import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { DataStore, DEFAULT_DATA, Inspiration } from './types';

const STORE_NAME = 'inspiration-store';
const KEY = 'data-v1';
const IMAGE_STORE_NAME = 'inspiration-images';

// 关键：Netlify Functions 推荐做法是把 handler 收到的 context 传给 getStore
// 不能用 env.NETLIFY_BLOBS_TOKEN（nfp_ 格式是 UI 用的，跑 Functions 时 401）
let _netlifyContext: Context | undefined;

/** 在 handler 入口调用一次，把 context 注入 storage */
export function setNetlifyContext(ctx: Context | undefined) {
  _netlifyContext = ctx;
}

function getStoreOptions(name: string) {
  // 1) 优先：用 Netlify Functions 自动注入的 NETLIFY_BLOBS_CONTEXT（base64 JSON）
  //    必须能真正解码（netlify dev 会把不存在的 env 注入成字符串 "undefined"）
  const envContext = process.env.NETLIFY_BLOBS_CONTEXT;
  if (envContext && envContext !== 'undefined' && envContext.length > 100) {
    try {
      const ctx = JSON.parse(
        Buffer.from(envContext, 'base64').toString('utf8'),
      );
      if (ctx.siteID && ctx.token) {
        return getStore({
          name,
          siteID: ctx.siteID,
          token: ctx.token,
          edgeURL: ctx.edgeURL,
          uncachedEdgeURL: ctx.uncachedEdgeURL,
        } as any);
      }
    } catch {
      // 解码失败不算错，继续尝试其他 source
    }
  }

  // 2) Netlify Functions 自动注入的 globalThis context
  if ((globalThis as any).netlifyBlobsContext) {
    return getStore(name);
  }

  // 3) 本地 dev / 显式配置：.env 里的 token
  //    注意：nfp_ 格式的 token 仅用于 Netlify UI，运行时可能 401
  //    本地 dev 是 OK 的（netlify dev 内部用真实凭证代理）
  const siteID = process.env.MY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({
      name,
      siteID,
      token,
    } as any);
  }

  // 4) 兜底
  return getStore(name);
}

function getDataStore() {
  return getStoreOptions(STORE_NAME);
}

export function getImageStore() {
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
      userFeedbacks: data.userFeedbacks || [],
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
  startDate?: string;
  endDate?: string;
}): Promise<Inspiration[]> {
  const data = await loadData();
  let list = Object.values(data.inspirations);

  if (filter?.subCategory) {
    const target = filter.subCategory;
    list = list.filter(i => {
      // 优先用新 API：subCategories 数组（多选）
      if (Array.isArray(i.subCategories) && i.subCategories.length > 0) {
        return i.subCategories.includes(target);
      }
      // 兼容老 API：subCategory 单数字符串
      return i.subCategory === target;
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
      // 标题
      if ((i.title || '').toLowerCase().includes(k)) return true;
      // 描述
      if ((i.description || '').toLowerCase().includes(k)) return true;
      // My idea：标签
      if ((i.tags || []).some(t => t.toLowerCase().includes(k))) return true;
      // My idea：备注
      if ((i.userNote || '').toLowerCase().includes(k)) return true;
      // AI 视觉描述（"帮你找"用）
      if ((i.visualDescription || '').toLowerCase().includes(k)) return true;
      if ((i.aiSuggestion?.visualDescription || '').toLowerCase().includes(k)) return true;
      // AI 视觉标签
      const allTags = [
        ...(i.visualTags || []),
        ...(i.aiSuggestion?.visualTags || []),
      ];
      if (allTags.some(t => t.toLowerCase().includes(k))) return true;
      return false;
    });
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
