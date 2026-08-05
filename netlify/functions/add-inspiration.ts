// netlify/functions/add-inspiration.ts
// 添加一条灵感
// 支持三种调用方式：
//   1. GET /api/add?url=xxx&title=yyy
//   2. POST /api/add {"url": "xxx", ...}
//   3. POST /api/add {"url": "xxx", "imageBase64": "..."} 截图模式

import { Handler, HandlerContext } from '@netlify/functions';
import { Inspiration, detectPlatform } from './lib/types';
import { addInspiration, findByUrl, saveImage } from './lib/storage';
import { jsonResponse, errorResponse, generateId, requireAuth, isValidUrl } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, context) => {
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

    // 手动添加可以没 URL（仅靠截图）—— 但必须有 url 或 imageBase64 至少一个
    // 留个口子：完全空数据直接拒绝
    if (!url && !imageBase64) {
      return errorResponse('需要至少提供链接或截图其中一项');
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
    // platform 推断：
    // - 有 URL 走 detectPlatform
    // - 截图模式（iPhone shortcut / 相簿自动化）默认小红书（最常见来源）
    // - 手动添加且无 URL：标"未指定"
    let platform: string = 'other';
    if (url) {
      platform = detectPlatform(url);
    } else if (source === 'album-automation' || source === 'shortcut') {
      platform = 'xiaohongshu';
    } else if (source === 'manual' && !url) {
      platform = 'unspecified';
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

    // 2. 创建占位记录（status: pending — AI 整理在网页端批量触发）
    const placeholder: Inspiration = {
      id,
      url: url || `screenshot://${id}`,  // 没 URL 就用占位
      title: providedTitle || '待整理',
      platform,
      coverImage: coverImageUrl,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      source,
    };
    await addInspiration(placeholder);

    // 3. （不再自动 AI 分类）—— 改为用户主动在网页端批量触发 /api/batch-classify
    //    这样 iPhone 录入秒回，AI 调用可控、可在有空时统一处理

    return jsonResponse({
      success: true,
      dedup: false,
      inspiration: placeholder,
      message: imageBase64
        ? '图片已存，待 AI 整理'
        : '已保存，待 AI 整理',
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

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
