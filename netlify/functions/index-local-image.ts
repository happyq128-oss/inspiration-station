// netlify/functions/index-local-image.ts
// "硬盘索引"入库端点
// POST /api/index-local-image
// body: {
//   localPath: string,           // Mac 硬盘绝对路径
//   parentDir?: string,          // 直接父目录名（用于自动标题）
//   grandparentDir?: string,     // 父父目录名（用于自动推断 venueType）
//   imageBase64: string,         // 文件 base64（去前缀）
//   mime?: string,               // 选填，默认 image/jpeg
//   title?: string,              // 选填，默认从 parentDir 推断
// }
// 流程：sharp 压缩 640px+240px → 存 Blobs → 跑 Qwen-VL 归类 + 视觉描述 → 算 embedding
// 返回：{ success, inspiration, parentDir, grandparentDir, autoInferredVenue }

import { Handler } from '@netlify/functions';
import { Inspiration, detectPlatform } from './lib/types';
import { addInspiration } from './lib/storage';
import { processAndSaveImage } from './lib/image';
import { aiClassify } from './lib/ai';
import { embedText, buildSearchableText } from './lib/embedding';
import { jsonResponse, errorResponse, requireAuth, generateId } from './lib/utils';
import { withContext } from './lib/handler';

const VENUE_FOLDERS = ['博物馆', '纪念馆', '企业馆', 'museum', 'memorial', 'corporate'];

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      localPath,
      parentDir: providedParentDir,
      grandparentDir: providedGrandparentDir,
      imageBase64,
      mime,
      title: providedTitle,
    } = body;

    if (!localPath || typeof localPath !== 'string') {
      return errorResponse('缺少 localPath');
    }
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return errorResponse('缺少 imageBase64');
    }

    // 1) 处理图片：sharp 压缩 640px + 240px → 存 Blobs
    const t0 = Date.now();
    const id = generateId();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      return errorResponse('imageBase64 解码后为空');
    }
    if (buffer.length > 10 * 1024 * 1024) {
      return errorResponse('图片超过 10MB 限制');
    }

    const imgResult = await processAndSaveImage(id, buffer);
    if (!imgResult) {
      return errorResponse('图片处理失败（sharp 错误）');
    }
    console.log(`[index-local] image processed in ${Date.now() - t0}ms: main=${imgResult.mainSize}B, thumb=${imgResult.thumbSize}B`);

    // 2) 自动推断 title（如果用户没传）
    const parentDir = providedParentDir || '';
    const grandparentDir = providedGrandparentDir || '';
    const title = (providedTitle || parentDir || '硬盘图').trim().slice(0, 200);

    // 3) 自动推断 venueType：
    //    先看 grandparentDir 是不是标准三类（兼容英文）
    //    如果不是，从 localPath 整路径里爬任意一级找匹配（你的结构可能是 博物馆/国外馆套图/三星堆）
    let autoVenueId: string | undefined;
    let autoVenueName: string | undefined;
    let autoVenueMatched: string | undefined;

    const tryMatch = (name: string): { id: string; name: string } | null => {
      const t = name.trim();
      if (t === '博物馆' || t.toLowerCase() === 'museum') return { id: 'museum', name: '博物馆' };
      if (t === '纪念馆' || t.toLowerCase() === 'memorial') return { id: 'memorial', name: '纪念馆' };
      if (t === '企业馆' || t.toLowerCase() === 'corporate') return { id: 'corporate', name: '企业馆' };
      return null;
    };

    // 优先级 1：grandparentDir（local-bridge 已经算好）
    if (grandparentDir) {
      const m = tryMatch(grandparentDir);
      if (m) { autoVenueId = m.id; autoVenueName = m.name; autoVenueMatched = grandparentDir; }
    }
    // 优先级 2：爬全路径找
    if (!autoVenueId && localPath) {
      const parts = localPath.split('/').filter(Boolean);
      // 倒序遍历：先看靠近文件的目录，再到顶层（用户主动分馆的层级更"权威"）
      for (let i = parts.length - 2; i >= 0; i--) {
        const m = tryMatch(parts[i]);
        if (m) {
          autoVenueId = m.id;
          autoVenueName = m.name;
          autoVenueMatched = parts[i];
          break;
        }
      }
    }

    // 4) 跑 AI 归类 + 视觉描述（用于"帮你找"）
    //    即使 venueType 已经推断，AI 仍然要跑（形式小类 + 视觉描述）
    const aiResult = await aiClassify({
      title,
      description: parentDir ? `所在文件夹: ${parentDir}` : undefined,
      coverImage: imgResult.mainUrl,  // /api/image/{id} 路径，ai.ts 会自己读 Blobs
      platform: 'other',
      categories: [],  // 让 ai 用默认
      venueTypes: [],  // 让 ai 用默认
    });

    // 5) 算 embedding（"帮你找"用）
    let visualEmbedding: number[] | undefined;
    if (aiResult.visualDescription) {
      const searchText = buildSearchableText({
        visualDescription: aiResult.visualDescription,
        visualTags: aiResult.visualTags,
        title,
        subCategoryNames: aiResult.subCategoryNames,
        venueTypeName: autoVenueName || aiResult.venueTypeName,
      });
      const vec = await embedText(searchText);
      if (vec) visualEmbedding = vec;
    }
    console.log(`[index-local] AI done in ${Date.now() - t0}ms`);

    // 6) 合并 venueType：自动推断优先 > AI 建议
    const finalVenueId = autoVenueId || aiResult.venueType;
    const finalVenueName = autoVenueName || aiResult.venueTypeName;

    // 7) 创建 inspiration 记录（status=pending，让用户过 confirm 页确认）
    const now = new Date().toISOString();
    const insp: Inspiration = {
      id,
      url: '',  // 硬盘图没有线上 URL
      title,
      platform: 'other',
      coverImage: imgResult.mainUrl,
      coverThumbnail: imgResult.thumbUrl,
      localPath,
      description: grandparentDir ? `位于 ${grandparentDir} / ${parentDir}` : undefined,
      subCategories: aiResult.subCategories,
      subCategoryNames: aiResult.subCategoryNames,
      venueType: finalVenueId,
      venueTypeName: finalVenueName,
      status: 'pending',  // 等用户在 confirm 页确认后才变 organized
      aiSuggestion: aiResult,
      visualDescription: aiResult.visualDescription,
      visualTags: aiResult.visualTags,
      visualEmbedding,
      createdAt: now,
      updatedAt: now,
      source: 'local',  // 标记来源
    };
    await addInspiration(insp);
    console.log(`[index-local] stored: ${id}, total ${Date.now() - t0}ms`);

    return jsonResponse({
      success: true,
      inspiration: insp,
      parentDir,
      grandparentDir,
      autoInferredVenue: autoVenueId ? {
        id: autoVenueId,
        name: autoVenueName,
        reason: autoVenueMatched
          ? `从路径中的「${autoVenueMatched}」推断`
          : '从文件夹结构推断',
      } : null,
      duration: Date.now() - t0,
    });
  } catch (e: any) {
    console.error('[index-local] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
