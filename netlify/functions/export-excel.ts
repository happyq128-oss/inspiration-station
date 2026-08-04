// netlify/functions/export-excel.ts
// 导出 Excel
// - 按展馆类型分 4 个 sheet：博物馆 / 纪念馆 / 企业馆 / 未分类
// - 嵌入封面图（直接读 Blobs，跳过 /api/image 网络往返，压缩到 240px）
// - 形式小类支持多选（subCategoryNames 用 + 拼接显示）
// - 保留：封面/标题/小类/状态/平台/抓取时间/原始链接/描述/备注/补充标签
// - 删除：确认时间、ai置信度（不需要）

import { Handler } from '@netlify/functions';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import { loadData, getImage } from './lib/storage';
import { PLATFORM_LABELS, Inspiration } from './lib/types';
import { requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }
  if (!(await requireAuth(event))) {
    return {
      statusCode: 401,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  console.log(`[export] START`);
  const t0 = Date.now();
  const data = await loadData();
  console.log(`[export] loadData: ${Date.now() - t0}ms`);
  const all = Object.values(data.inspirations).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  console.log(`[export] all items: ${all.length}`);

  // 过滤参数
  const params = event.queryStringParameters || {};
  const filterStatus = params.status;
  const filterCategory = params.subCategory;
  const filterVenue = params.venueType;
  const filterKeyword = (params.keyword || '').toLowerCase();
  // 日期范围：YYYY-MM-DD，按 createdAt 的日期部分比较（slice 出来就直接字典序比）
  const filterStartDate = params.startDate || '';
  const filterEndDate = params.endDate || '';

  const filtered = all.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterCategory && i.subCategory !== filterCategory) return false;
    if (filterVenue && i.venueType !== filterVenue) return false;
    if (filterStartDate || filterEndDate) {
      const d = (i.createdAt || '').slice(0, 10);
      if (filterStartDate && d < filterStartDate) return false;
      if (filterEndDate && d > filterEndDate) return false;
    }
    if (filterKeyword) {
      const k = filterKeyword;
      if (
        !(i.title || '').toLowerCase().includes(k) &&
        !(i.description || '').toLowerCase().includes(k) &&
        !(i.userNote || '').toLowerCase().includes(k) &&
        !(i.tags || []).some(t => t.toLowerCase().includes(k))
      ) return false;
    }
    return true;
  });

  // 把灵感按展馆类型分桶
  const buckets: Record<string, { name: string; color: string; items: Inspiration[] }> = {
    museum:    { name: '博物馆',   color: '#3B82F6', items: [] },
    memorial:  { name: '纪念馆',   color: '#EF4444', items: [] },
    corporate: { name: '企业馆',   color: '#10B981', items: [] },
    unclassified: { name: '未分类', color: '#9CA3AF', items: [] },
  };
  for (const insp of filtered) {
    const vt = insp.venueType || 'unclassified';
    if (buckets[vt]) buckets[vt].items.push(insp);
    else buckets.unclassified.items.push(insp);
  }

  // 计算请求 origin（用于把 /api/image/xxx 转成 https://xxx.netlify.app/api/image/xxx）
  const origin = getRequestOrigin(event);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = '灵感站 Inspiration Station';
  workbook.created = new Date();

  // 4 个 sheet 按顺序：博物馆 → 纪念馆 → 企业馆 → 未分类
  // 未分类 sheet 仅在有内容时生成
  const sheetOrder = ['museum', 'memorial', 'corporate', 'unclassified'] as const;

  // 1) 先把每条灵感的缩略图预拉好（控制并发数 6，避免 sharp cold start 阻塞）
  const allItems = filtered;
  const thumbCache = new Map<string, Buffer | null>();
  const CONCURRENCY = 6;
  for (let i = 0; i < allItems.length; i += CONCURRENCY) {
    const batch = allItems.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (insp) => {
      if (!insp.coverImage) {
        thumbCache.set(insp.id, null);
        return;
      }
      try {
        const buf = await getLocalThumbnail(insp.coverImage, origin);
        thumbCache.set(insp.id, buf);
      } catch {
        thumbCache.set(insp.id, null);
      }
    }));
  }
  console.log(`[export] thumbs ready: ${Date.now() - t0}ms, count=${allItems.length}, valid=${[...thumbCache.values()].filter(Boolean).length}`);

  for (const bucketKey of sheetOrder) {
    const bucket = buckets[bucketKey];
    if (bucket.items.length === 0 && bucketKey === 'unclassified') continue;

    await buildSheet(workbook, bucket.name, bucket.color, bucket.items, data.categories, data.venueTypes, thumbCache, origin);
  }
  console.log(`[export] sheets built: ${Date.now() - t0}ms`);

  // 兜底：如果一个 sheet 都没建（比如全部被过滤掉）
  if (workbook.worksheets.length === 0) {
    const empty = workbook.addWorksheet('空');
    empty.addRow(['没有匹配的灵感']);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64');
  console.log(`[export] xlsx written: ${Date.now() - t0}ms, size=${base64.length}`);

  const dateStr = new Date().toISOString().slice(0, 10);
  const filenameAscii = `inspirations_${dateStr}.xlsx`;
  const filenameUtf8 = encodeURIComponent(`形式灵感库_${dateStr}.xlsx`);

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filenameAscii}"; filename*=UTF-8''${filenameUtf8}`,
      'X-Export-Duration-Ms': String(Date.now() - t0),
    },
    body: base64,
    isBase64Encoded: true,
  };
};

/**
 * 构造一个 sheet：封面(嵌图) + 其他列
 */
async function buildSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  sheetColor: string,
  items: Inspiration[],
  categories: { id: string; name: string; color: string }[],
  venueTypes: { id: string; name: string; color: string }[],
  thumbCache: Map<string, Buffer | null>,
  origin: string,
): Promise<void> {
  // 不再用 sheetColor 参数（保持 Excel 默认配色），但保留形参避免上层改动
  void sheetColor;
  void categories;
  void venueTypes;

  const sheet = workbook.addWorksheet(sheetName, {
    properties: { defaultRowHeight: 110 },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // 删除了"状态""描述"两列
  sheet.columns = [
    { header: '封面', key: 'cover', width: 18 },
    { header: '标题', key: 'title', width: 40 },
    { header: '形式小类', key: 'subCategory', width: 22 },
    { header: '展馆类型', key: 'venueType', width: 12 },
    { header: '平台', key: 'platform', width: 10 },
    { header: '抓取时间', key: 'createdAt', width: 20 },
    { header: '原始链接', key: 'url', width: 50 },
    { header: '备注', key: 'userNote', width: 30 },
    { header: '补充标签', key: 'tags', width: 25 },
  ];

  // 表头：只加粗居中，无任何 fill 背景色（保持 Excel 默认配色）
  sheet.getRow(1).font = { bold: true, size: 12 };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 28;

  // 写入每行
  for (let i = 0; i < items.length; i++) {
    const insp = items[i];

    // 形式小类：多选用 + 拼接
    const subCatNames = insp.subCategoryNames || (insp.aiSuggestion?.subCategoryNames) || (insp.subCategoryName ? [insp.subCategoryName] : []);
    const subCatDisplay = subCatNames.length > 0 ? subCatNames.join(' + ') : '未分类';

    // 展馆类型
    const venueName = insp.venueTypeName || insp.aiSuggestion?.venueTypeName || '';

    const row = sheet.addRow({
      cover: '',
      title: insp.title || '无标题',
      subCategory: subCatDisplay,
      venueType: venueName,
      platform: PLATFORM_LABELS[insp.platform] || insp.platform,
      createdAt: formatDate(insp.createdAt),
      url: insp.url ? { text: insp.url, hyperlink: insp.url } : '',
      userNote: insp.userNote || '',
      tags: (insp.tags || []).join(' '),
    });

    row.height = 110;
    row.alignment = { vertical: 'middle', wrapText: true };

    // 链接样式：只让 URL 字段带下划线 + 蓝色（Excel 默认行为，保留可点击）
    const urlCell = row.getCell('url');
    if (insp.url) {
      urlCell.font = { color: { argb: 'FF0563C1' }, underline: true };
    }

    // 封面列：暂不嵌入图（sharp + Blobs 在 Netlify 函数 cold start 太慢）
    // 改成"封面链接"：让用户点 URL 直接打开原图（保持可点击）
    const coverCell = row.getCell('cover');
    if (insp.coverImage) {
      const fullUrl = insp.coverImage.startsWith('http')
        ? insp.coverImage
        : `${origin}${insp.coverImage.startsWith('/') ? '' : '/'}${insp.coverImage}`;
      coverCell.value = { text: '📷 查看封面', hyperlink: fullUrl };
      coverCell.font = { color: { argb: 'FF0563C1' }, underline: true };
      coverCell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      coverCell.value = '无封面';
      coverCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  // 底部统计行
  if (items.length > 0) {
    sheet.addRow([]);
    const summaryRow = sheet.addRow(['', `共 ${items.length} 条灵感`, '', '', '', '', '', '', '']);
    summaryRow.font = { italic: true };
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { hour12: false });
}

function hexToArgb(hex: string, alpha: string): string {
  const h = hex.replace('#', '').toUpperCase();
  return alpha + h;
}

/** 把相对路径 /api/image/xxx 补成绝对 URL；已经是 http(s) 的原样返回 */
function toAbsoluteUrl(url: string, origin: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return origin + url;
  return origin + '/' + url;
}

/** 从 event 头里提取 origin（host + protocol） */
function getRequestOrigin(event: any): string {
  const headers = event.headers || {};
  const host = headers['x-forwarded-host'] || headers['host'] || headers['X-Forwarded-Host'] || '';
  const proto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto'] || 'https';
  if (host) return `${proto}://${host}`;
  return 'https://lovely-lolly-5bf390.netlify.app'; // 兜底
}

/**
 * 拿缩略图：暂时禁用（sharp + Blobs 冷启动在 Netlify 函数上会超时）
 * 后续方案：上传时同步生成 160px 缩略图存 Blobs，导出直接拿，跳过 sharp
 * 现在直接返回 null，导出表格里"封面"列显示原图 URL
 */
async function getLocalThumbnail(_coverImage: string, _origin: string): Promise<Buffer | null> {
  return null;
}

async function doGetLocalThumbnail(_coverImage: string, _origin: string): Promise<Buffer | null> {
  return null;
}

async function resizeToJpeg(_raw: Buffer, _width: number, _quality: number): Promise<Buffer | null> {
  return null;
}

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InspirationStation/1.0)' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
