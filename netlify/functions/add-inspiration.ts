// netlify/functions/add-inspiration.ts
// 添加一条灵感
// 支持三种调用方式：
//   1. GET /api/add?url=xxx&title=yyy
//   2. POST /api/add {"url": "xxx", ...}
//   3. POST /api/add {"url": "xxx", "imageBase64": "..."} 截图模式

import { Handler } from '@netlify/functions';
import { Inspiration, detectPlatform } from './lib/types';
import { addInspiration, findByUrl, saveImage, loadData } from './lib/storage';
import { jsonResponse, errorResponse, generateId, requireAuth, isValidUrl } from './lib/utils';
import { scrapePage } from './lib/scraper';
import { aiClassify } from './lib/ai';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    let url: string | undefined;
    let providedTitle: string | undefined;
    let source = 'shortcut';
    let imageBase64: string | undefined;

    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      url = params.url;
      providedTitle = params.title;
      source = params.source || 'shortcut';
    } else {
      const body = JSON.parse(event.body || '{}');
      url = body.url;
      providedTitle = body.title;
      source = body.source || 'shortcut';
      imageBase64 = body.imageBase64;
    }

    if (!url && !imageBase64) return errorResponse('Either url or imageBase64 is required');

    // URL 校验：剪贴板可能传过来非 URL 内容（比如"复制链接"漏了），过滤掉
    if (url) {
      url = normalizeUrl(url);
      if (!looksLikeUrl(url)) {
        console.log(`[add] URL doesn't look valid, ignored: ${url.slice(0, 30)}`);
        url = undefined;
      }
    }

    // 去重
    if (url) {
      const existing = await findByUrl(url);
      if (existing) {
        return jsonResponse({
          success: true,
          dedup: true,
          inspiration: existing,
          message: '该链接已存在，已返回原记录',
        });
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    // platform 推断：有 url 走 detect；没 url 但走相簿自动化，默认小红书（最常见来源）
    let platform: string = 'other';
    if (url) {
      platform = detectPlatform(url);
    } else if (source === 'album-automation' || source === 'shortcut') {
      platform = 'xiaohongshu';
    }

    // 1. 存截图
    let coverImageUrl: string | undefined;
    if (imageBase64 && typeof imageBase64 === 'string') {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        if (buffer.length > 0 && buffer.length < 5 * 1024 * 1024) {
          await saveImage(id, buffer, 'image/jpeg');
          coverImageUrl = `/api/image/${id}`;
        }
      } catch (e) {
        console.warn(`[${id}] Save image error:`, e);
      }
    }

    // 2. 创建占位记录
    const placeholder: Inspiration = {
      id,
      url: url || `screenshot://${id}`,  // 没 URL 就用占位
      title: providedTitle || '加载中...',
      platform,
      coverImage: coverImageUrl,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      source,
    };
    await addInspiration(placeholder);

    // 3. 异步 AI 分类
    (async () => {
      try {
        const data = await loadData();

        let titleForAI = providedTitle || '';
        let descriptionForAI: string | undefined;

        // 如果没图，尝试抓取
        if (!imageBase64 && url && url.startsWith('http')) {
          const scraped = await scrapePage(url);
          titleForAI = scraped.title || providedTitle || '';
          descriptionForAI = scraped.description;
        }

        const aiResult = await aiClassify({
          title: titleForAI,
          description: descriptionForAI,
          imageBase64: imageBase64,
          platform,
          categories: data.categories,
          venueTypes: data.venueTypes,
        });

        const { updateInspiration } = await import('./lib/storage');
        await updateInspiration(id, {
          title: titleForAI || providedTitle || '无标题',
          description: descriptionForAI,
          aiSuggestion: aiResult,
          updatedAt: new Date().toISOString(),
        });
        console.log(`[${id}] AI: ${aiResult.subCategoryName} / ${aiResult.venueTypeName} (${aiResult.confidence}%)`);
      } catch (e) {
        console.error(`[${id}] Async error:`, e);
      }
    })();

    return jsonResponse({
      success: true,
      dedup: false,
      inspiration: placeholder,
      message: imageBase64
        ? '已保存截图，AI 后台看图分类中'
        : '已保存，AI 后台整理中',
    }, 201);
  } catch (e: any) {
    console.error('Add inspiration error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

// URL 标准化：处理小红书特殊 schema 和短链
function normalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';

  // 已经是合法 http(s) URL
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  // 小红书 APP schema: xhsdiscover://item/xxx
  let m = rawUrl.match(/^xhs(discover|note):\/\/(item|note)\/([a-zA-Z0-9]+)/);
  if (m) return `https://www.xiaohongshu.com/explore/${m[3]}`;

  // 抖音 schema: snssdk123:// 或 aweme://
  m = rawUrl.match(/^(snssdk\d+|aweme):\/\/([^\/]+)\/([a-zA-Z0-9]+)/);
  if (m) return `https://www.douyin.com/video/${m[3]}`;

  // 纯 ID（小红书 24位 hex）
  if (/^[a-zA-Z0-9]{20,30}$/.test(rawUrl)) {
    return `https://www.xiaohongshu.com/explore/${rawUrl}`;
  }

  // 没协议，包装成 https —— 但只在"看起来像域名"时（避免把垃圾文本包装成 URL）
  if (!rawUrl.includes('://')) {
    if (/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}/.test(rawUrl)) {
      return `https://${rawUrl}`;
    }
    // 不像域名，原样返回（让 looksLikeUrl 失败）
  }

  return rawUrl;
}

// 判断是否"看起来像 URL"：避免剪贴板里的非 URL 内容被当作 url 存下来
function looksLikeUrl(s: string): boolean {
  if (!s) return false;
  // http(s) 协议
  if (/^https?:\/\//i.test(s)) return true;
  // 各种 APP schema
  if (/^xhs(discover|note):\/\//i.test(s)) return true;
  if (/^snssdk\d+:\/\//i.test(s)) return true;
  if (/^aweme:\/\//i.test(s)) return true;
  // 纯 24 位 hex ID
  if (/^[a-zA-Z0-9]{20,30}$/.test(s)) return true;
  return false;
}

export { handler };
