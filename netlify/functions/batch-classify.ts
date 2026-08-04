// netlify/functions/batch-classify.ts
// 批量 AI 整理（同步模式：每次 1 条，避免 Netlify 10s timeout）
// 前端串行调多次直到 hasMore=false
// POST /api/batch-classify
// body: { all?: true }  - 整理 pending
//        { ids?: string[] } - 整理指定 id
//        { limit?: number } - 最多处理多少条（默认 1）

import { Handler, HandlerContext } from '@netlify/functions';
import { loadData, updateInspiration } from './lib/storage';
import { scrapePage } from './lib/scraper';
import { aiClassify } from './lib/ai';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

interface BatchResult {
  id: string;
  ok: boolean;
  error?: string;
  subCategories?: string[];
  venueType?: string;
  confidence?: number;
}

const _innerHandler: Handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  let body: any = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const all = !!body.all;
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;
  // 同步模式：每次最多 1 条（避免 Netlify 10s timeout）
  const limit = typeof body.limit === 'number' && body.limit > 0 && body.limit <= 3
    ? Math.floor(body.limit)
    : 1;

  if (!all && !ids) {
    return errorResponse('Either all=true or ids[] is required', 400);
  }

  const singleForce = ids && ids.length === 1;

  try {
    const data = await loadData();
    const inspirations = data.inspirations || {};

    let toProcess: string[] = [];
    if (all) {
      toProcess = Object.keys(inspirations)
        .filter(id => {
          const i = inspirations[id];
          if (i.status !== 'pending') return false;
          // 跳过已 AI 跑过（有 aiSuggestion 且 confidence>0）的：避免重复烧 Qwen token
          if (i.aiSuggestion && (i.aiSuggestion.confidence || 0) > 0) return false;
          return true;
        })
        .sort((a, b) => (inspirations[a].createdAt || '').localeCompare(inspirations[b].createdAt || ''));
    } else if (ids) {
      toProcess = singleForce ? ids : ids.filter(id => {
        const insp = inspirations[id];
        return insp && insp.status === 'pending';
      });
    }

    if (toProcess.length === 0) {
      return jsonResponse({
        success: true,
        processed: 0,
        successCount: 0,
        failed: [],
        results: [],
        remaining: 0,
        hasMore: false,
        message: '没有待整理的灵感',
      });
    }

    const originalCount = toProcess.length;
    toProcess = toProcess.slice(0, limit);
    const remaining = originalCount - toProcess.length;

    console.log(`[batch] Processing ${toProcess.length} inspirations, ${remaining} remaining`);

    const results: BatchResult[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of toProcess) {
      const insp = inspirations[id];
      if (!insp) {
        failed.push({ id, error: '灵感不存在' });
        results.push({ id, ok: false, error: '灵感不存在' });
        continue;
      }

      try {
        // 直接用 coverImage URL（Qwen-VL 支持 https URL，不需 Blobs 读图）
        let coverImageUrl: string | undefined;
        if (insp.coverImage) {
          coverImageUrl = insp.coverImage.startsWith('http')
            ? insp.coverImage
            : `https://${event.headers.host || 'lovely-lolly-5bf390.netlify.app'}${insp.coverImage}`;
        }

        let titleForAI = insp.title || '';
        let descriptionForAI = insp.description;
        if (!coverImageUrl && insp.url && insp.url.startsWith('http')) {
          try {
            const scraped = await scrapePage(insp.url);
            if (scraped.title) titleForAI = scraped.title;
            if (scraped.description) descriptionForAI = scraped.description;
          } catch (e) {
            console.warn(`[batch ${id}] scrape failed:`, e);
          }
        }

        const aiResult = await aiClassify({
          title: titleForAI,
          description: descriptionForAI,
          coverImage: coverImageUrl,
          platform: insp.platform,
          categories: data.categories,
          venueTypes: data.venueTypes,
        });

        await updateInspiration(id, {
          title: titleForAI || insp.title || '无标题',
          description: descriptionForAI,
          aiSuggestion: aiResult,
          subCategories: aiResult.subCategories,
          subCategoryNames: aiResult.subCategoryNames,
          venueType: aiResult.venueType,
          venueTypeName: aiResult.venueTypeName,
          // 状态保持 pending——AI 只给建议，等用户手动进 confirm 确认后才变 organized
          status: 'pending',
          updatedAt: new Date().toISOString(),
        });

        console.log(`[batch ${id}] ✓ ${aiResult.subCategoryNames.join('+')} / ${aiResult.venueTypeName} (${aiResult.confidence}%)`);
        results.push({
          id,
          ok: true,
          subCategories: aiResult.subCategories,
          venueType: aiResult.venueType,
          confidence: aiResult.confidence,
        });
      } catch (e: any) {
        console.error(`[batch ${id}] error:`, e);
        failed.push({ id, error: e.message || 'Unknown error' });
        results.push({ id, ok: false, error: e.message });
      }
    }

    return jsonResponse({
      success: true,
      processed: toProcess.length,
      successCount: results.filter(r => r.ok).length,
      failed,
      results,
      remaining,
      hasMore: remaining > 0,
    });
  } catch (e: any) {
    console.error('Batch classify error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

export const handler: Handler = withContext(async (event, context) => _innerHandler(event, context));
