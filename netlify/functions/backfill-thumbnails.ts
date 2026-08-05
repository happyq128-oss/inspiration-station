// netlify/functions/backfill-thumbnails.ts
// 一次性 backfill：给老图生成 240px 缩略图（Excel 嵌入用）
// POST /api/backfill-thumbnails
// body: { limit?: number, onlyMissing?: boolean, ids?: string[] }
// 同步模式：每批 1-3 条（每条 ~500ms）

import { Handler } from '@netlify/functions';
import { loadData, updateInspiration, getImage } from './lib/storage';
import { generateThumbnailForExisting } from './lib/image';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';
import { Inspiration } from './lib/types';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  let body: any = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}

  const limit = Math.min(3, Math.max(1, Number(body.limit) || 1));
  const onlyMissing = body.onlyMissing !== false;
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

  try {
    const t0 = Date.now();
    const data = await loadData();
    const all = Object.values(data.inspirations);

    let targets: Inspiration[];
    if (ids) {
      targets = ids.map(id => data.inspirations[id]).filter(Boolean);
    } else if (onlyMissing) {
      // 有 coverImage 但没 coverThumbnail 的
      targets = all.filter(i => i.coverImage && !i.coverThumbnail);
    } else {
      // 强制重算
      targets = all.filter(i => i.coverImage);
    }

    targets.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

    const total = targets.length;
    const toProcess = targets.slice(0, limit);

    console.log(`[backfill-thumb] total=${total}, processing=${toProcess.length}`);

    const results: any[] = [];
    for (const insp of toProcess) {
      try {
        // 读主图
        const idFromPath = (insp.coverImage || '').match(/\/api\/image\/([A-Za-z0-9_]+)/)?.[1];
        if (!idFromPath) {
          results.push({ id: insp.id, ok: false, reason: 'coverImage 路径解析失败' });
          continue;
        }

        const img = await getImage(idFromPath);
        if (!img) {
          results.push({ id: insp.id, ok: false, reason: '主图不存在' });
          continue;
        }

        // 生成缩略图
        const t = await generateThumbnailForExisting(insp.id, img.buffer);
        if (!t) {
          results.push({ id: insp.id, ok: false, reason: 'sharp 处理失败' });
          continue;
        }

        // 更新 inspiration.coverThumbnail
        const thumbUrl = `/api/image/${insp.id}?thumb=1`;
        await updateInspiration(insp.id, {
          coverThumbnail: thumbUrl,
          updatedAt: new Date().toISOString(),
        });

        results.push({
          id: insp.id,
          ok: true,
          thumbSize: t.thumbSize,
        });
        console.log(`[backfill-thumb] ✓ ${insp.id}: ${t.thumbSize}B`);
      } catch (e: any) {
        console.error(`[backfill-thumb] ${insp.id} error:`, e);
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
    console.error('[backfill-thumb] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
