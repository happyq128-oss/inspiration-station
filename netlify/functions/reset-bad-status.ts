// netlify/functions/reset-bad-status.ts
// 一键修复：把 AI 自动标记的"已整理"（没 confirmedAt）重置回"待整理"
// + 把 AI 跑过但 confidence=0（兜底结果）的清掉 aiSuggestion，让 batch-classify 重新跑
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
    const candidates: { id: string; title: string; reason: string }[] = [];
    for (const [id, insp] of Object.entries(data.inspirations)) {
      // 情况 1：status='organized' 但没 confirmedAt → AI 误标"已整理"
      if (insp.status === 'organized' && !insp.confirmedAt) {
        candidates.push({ id, title: insp.title || '无标题', reason: 'organized-without-confirm' });
        if (!dryRun) {
          insp.status = 'pending';
        }
        continue;
      }
      // 情况 2：AI 跑过但 0% 置信度（兜底结果）→ 清掉 aiSuggestion 让用户能重跑
      if (insp.aiSuggestion && (insp.aiSuggestion.confidence || 0) === 0) {
        candidates.push({ id, title: insp.title || '无标题', reason: 'ai-zero-confidence' });
        if (!dryRun) {
          delete insp.aiSuggestion;
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
      resetItems: candidates.slice(0, 20),
      message: dryRun
        ? `检测到 ${candidates.length} 条需要重置的灵感（误标已整理 + AI 0% 兜底）`
        : (candidates.length > 0
            ? `✓ 已重置 ${candidates.length} 条（包含 ${candidates.filter(c => c.reason === 'ai-zero-confidence').length} 条 0% 置信度）`
            : '没有需要重置的灵感'),
    });
  } catch (e: any) {
    console.error('[reset-bad-status] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
