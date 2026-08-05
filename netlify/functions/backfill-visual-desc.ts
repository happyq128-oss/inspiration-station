// netlify/functions/backfill-visual-desc.ts
// 一次性 backfill：给已有灵感补 visualDescription / visualTags / visualEmbedding
// 同步模式：每次 1 条，避免 Netlify 10s timeout
// POST /api/backfill-visual-desc
// body: { limit?: number, onlyMissing?: boolean, ids?: string[] }
// - onlyMissing: true (默认) = 只补没 visualDescription 的；false = 强制重算
// - ids: 指定 id 列表（调试用）

import { Handler } from '@netlify/functions';
import { loadData, updateInspiration } from './lib/storage';
import { aiClassify } from './lib/ai';
import { embedText, buildSearchableText, EMBEDDING_DIM } from './lib/embedding';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';
import { Inspiration } from './lib/types';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  let body: any = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  const limit = Math.min(5, Math.max(1, Number(body.limit) || 1));
  const onlyMissing = body.onlyMissing !== false; // 默认 true
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

  try {
    const t0 = Date.now();
    const data = await loadData();
    const all = Object.values(data.inspirations);

    let targets: Inspiration[];
    if (ids) {
      targets = ids.map(id => data.inspirations[id]).filter(Boolean);
    } else if (onlyMissing) {
      targets = all.filter(i => !i.visualDescription);
    } else {
      targets = all;
    }

    // 跳过没封面的（没法 AI 看图生成描述）—— 用户手动补的另说
    // 但如果 iPhone shortcut 截图了，那一定有 coverImage
    if (!ids) {
      targets = targets.filter(i => i.coverImage);
    }

    // 按 createdAt 升序：先补老的
    targets.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

    const total = targets.length;
    const toProcess = targets.slice(0, limit);

    console.log(`[backfill] total missing=${total}, processing ${toProcess.length}`);

    const results: any[] = [];
    const event_ = event as any;
    for (const insp of toProcess) {
      try {
        // Step 1: 调 Qwen-VL 重跑分类（带 visualDescription 输出）
        let coverImageUrl: string | undefined;
        if (insp.coverImage) {
          coverImageUrl = insp.coverImage.startsWith('http')
            ? insp.coverImage
            : `https://${event_.headers?.host || 'lovely-lolly-5bf390.netlify.app'}${insp.coverImage}`;
        }

        const aiResult = await aiClassify({
          title: insp.title,
          description: insp.description,
          coverImage: coverImageUrl,
          platform: insp.platform,
          categories: data.categories,
          venueTypes: data.venueTypes,
        });

        if (!aiResult.visualDescription) {
          // AI 没说——可能是没图或被内容审核；标记为已尝试
          await updateInspiration(insp.id, {
            aiSuggestion: aiResult,
            updatedAt: new Date().toISOString(),
          });
          results.push({ id: insp.id, ok: false, reason: 'AI 未生成描述' });
          continue;
        }

        // Step 2: 算 embedding 存下来
        const searchText = buildSearchableText({
          visualDescription: aiResult.visualDescription,
          visualTags: aiResult.visualTags,
          title: insp.title,
          subCategoryNames: aiResult.subCategoryNames,
          venueTypeName: aiResult.venueTypeName,
        });
        const vec = await embedText(searchText);

        // Step 3: 持久化
        await updateInspiration(insp.id, {
          aiSuggestion: aiResult,
          visualDescription: aiResult.visualDescription,
          visualTags: aiResult.visualTags,
          visualEmbedding: vec || undefined,
          // 同时把分类也写上（如果原来没有）
          subCategories: insp.subCategories?.length ? insp.subCategories : aiResult.subCategories,
          subCategoryNames: insp.subCategoryNames?.length ? insp.subCategoryNames : aiResult.subCategoryNames,
          venueType: insp.venueType || aiResult.venueType,
          venueTypeName: insp.venueTypeName || aiResult.venueTypeName,
          updatedAt: new Date().toISOString(),
        });

        results.push({
          id: insp.id,
          ok: true,
          visualDescription: aiResult.visualDescription.slice(0, 50) + '...',
          tags: (aiResult.visualTags || []).length,
          hasEmbedding: !!vec,
        });
        console.log(`[backfill ${insp.id}] ✓`);
      } catch (e: any) {
        console.error(`[backfill ${insp.id}] error:`, e);
        results.push({ id: insp.id, ok: false, error: e.message });
      }
    }

    const processed = toProcess.length;
    const remaining = total - processed;
    const successCount = results.filter(r => r.ok).length;

    return jsonResponse({
      success: true,
      totalMissing: total,
      processed,
      successCount,
      failed: processed - successCount,
      remaining,
      hasMore: remaining > 0,
      results,
      duration: Date.now() - t0,
    });
  } catch (e: any) {
    console.error('[backfill] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
