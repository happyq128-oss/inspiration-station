// netlify/functions/ai-classify.ts
// 手动触发 AI 重分类

import { Handler } from '@netlify/functions';
import { aiClassify } from './lib/ai';
import { updateInspiration, loadData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';
import { embedText, buildSearchableText } from './lib/embedding';

const _innerHandler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const { id } = body;
    if (!id) return errorResponse('Missing id');

    const data = await loadData();
    const insp = data.inspirations[id];
    if (!insp) return errorResponse('Inspiration not found', 404);

    // 把相对路径 /api/image/xxx 转成绝对 URL——Qwen-VL 需要完整 URL 才能 fetch
    let coverImageUrl: string | undefined;
    if (insp.coverImage) {
      if (insp.coverImage.startsWith('http')) {
        coverImageUrl = insp.coverImage;
      } else {
        // 优先用 event 的 host，否则用 Netlify 默认域名
        const host = event.headers?.host || event.headers?.['x-forwarded-host'] || 'lovely-lolly-5bf390.netlify.app';
        const proto = event.headers?.['x-forwarded-proto'] || 'https';
        coverImageUrl = insp.coverImage.startsWith('/')
          ? `${proto}://${host}${insp.coverImage}`
          : `${proto}://${host}/${insp.coverImage}`;
      }
    }

    const aiResult = await aiClassify({
      title: insp.title,
      description: insp.description,
      coverImage: coverImageUrl,
      platform: insp.platform,
      categories: data.categories,
      venueTypes: data.venueTypes,
    });

    // 顺便算 embedding（"帮你找"用）—— 仅当 AI 给了 visualDescription 时
    let visualEmbedding: number[] | undefined;
    if (aiResult.visualDescription) {
      const searchText = buildSearchableText({
        visualDescription: aiResult.visualDescription,
        visualTags: aiResult.visualTags,
        title: insp.title,
        subCategoryNames: aiResult.subCategoryNames,
        venueTypeName: aiResult.venueTypeName,
      });
      const vec = await embedText(searchText);
      if (vec) visualEmbedding = vec;
    }

    const updated = await updateInspiration(id, {
      aiSuggestion: aiResult,
      visualDescription: aiResult.visualDescription || undefined,
      visualTags: aiResult.visualTags || undefined,
      visualEmbedding,
      updatedAt: new Date().toISOString(),
    });

    return jsonResponse({ success: true, inspiration: updated });
  } catch (e: any) {
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
