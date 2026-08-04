// netlify/functions/reset-bad-status.ts
// 一键修复：把 AI 自动标记的"已整理"（没 confirmedAt）重置回"待整理"
// 用于修复 batch-classify 之前那个自动标已整理的 bug 留下的脏数据
// POST /api/reset-bad-status
// body: {} 或 { dryRun: true }（只统计不实际改）

import { Handler } from '@netlify/functions';
import { loadData, saveData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  let body: any = {};
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const dryRun = !!body.dryRun;

  try {
    const data = await loadData();
    const candidates: { id: string; title: string }[] = [];
    for (const [id, insp] of Object.entries(data.inspirations)) {
      // 只重置：status='organized' 且没有 confirmedAt
      // （确认时间只由 update-inspiration 写入，所以没有它的一定是 AI 误标的）
      if (insp.status === 'organized' && !insp.confirmedAt) {
        candidates.push({ id, title: insp.title || '无标题' });
        if (!dryRun) {
          insp.status = 'pending';
        }
      }
    }

    if (!dryRun && candidates.length > 0) {
      await saveData(data);
    }

    return jsonResponse({
      success: true,
      dryRun,
      resetCount: candidates.length,
      resetItems: candidates.slice(0, 20),  // 最多返回前 20 个标题给前端显示
      message: dryRun
        ? `检测到 ${candidates.length} 条 AI 误标的"已整理"`
        : (candidates.length > 0
            ? `✓ 已重置 ${candidates.length} 条回到"待整理"`
            : '没有需要重置的灵感'),
    });
  } catch (e: any) {
    console.error('[reset-bad-status] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
