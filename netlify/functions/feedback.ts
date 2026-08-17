// netlify/functions/feedback.ts
// "帮你找"的用户偏好反馈
// POST /api/feedback
// body: { query: string, pickedInspId: string }
// 流程：
//   1. 算 query 的 embedding
//   2. 存到 data.userFeedbacks
//   3. 返回新 feedback 记录
//
// 限制：只保留最近 50 条（防止 storage 增长 + rerank 时算太多次 embedding）
//       同一 query 多次选同一张图：合并次数（不重复存）

import { Handler } from '@netlify/functions';
import { loadData, saveData } from './lib/storage';
import { embedText } from './lib/embedding';
import { jsonResponse, errorResponse, requireAuth, generateId } from './lib/utils';
import { withContext } from './lib/handler';
import { UserFeedback } from './lib/types';

const MAX_FEEDBACKS = 50;  // 最多保留 50 条
const SIMILAR_QUERY_THRESHOLD = 0.85;  // 同 query 阈值

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const query = (body.query || '').trim();
    const pickedInspId = (body.pickedInspId || '').trim();

    if (!query) return errorResponse('缺少 query');
    if (!pickedInspId) return errorResponse('缺少 pickedInspId');

    const t0 = Date.now();
    const data = await loadData();

    // 校验 pickedInspId 存在
    const pickedInsp = data.inspirations[pickedInspId];
    if (!pickedInsp) return errorResponse('选中的灵感不存在', 404);

    // 1) 算 query embedding
    const queryEmbedding = await embedText(query);

    // 2) 合并重复：同 query + 同 pickedInspId 的话，删掉老的、加新的（更新时间）
    const existing = (data.userFeedbacks || []).filter(f => {
      // 删除条件：query 高度相似 + pickedInspId 相同
      if (f.pickedInspId !== pickedInspId) return true;
      if (f.query.trim() === query) return false;
      // 不同 query 但 pickedInspId 相同：保留（可能用户在不同场景选过同一张图）
      return true;
    });

    // 简化：直接按 query 完全相等合并
    const deduped = (data.userFeedbacks || []).filter(f =>
      !(f.query.trim() === query && f.pickedInspId === pickedInspId)
    );

    const newFeedback: UserFeedback = {
      id: generateId(),
      query: query.slice(0, 500),
      queryEmbedding: queryEmbedding || undefined,
      pickedInspId,
      pickedTitle: pickedInsp.title,
      createdAt: new Date().toISOString(),
    };

    let updatedList = [...deduped, newFeedback];

    // 3) 限制最多 50 条：按时间倒序保留最新 50
    if (updatedList.length > MAX_FEEDBACKS) {
      updatedList = updatedList
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, MAX_FEEDBACKS);
    }

    data.userFeedbacks = updatedList;
    await saveData(data);

    console.log(`[feedback] stored: query="${query.slice(0, 30)}" -> ${pickedInspId}, dur=${Date.now() - t0}ms`);

    return jsonResponse({
      success: true,
      feedback: newFeedback,
      totalFeedbacks: updatedList.length,
      duration: Date.now() - t0,
    });
  } catch (e: any) {
    console.error('[feedback] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
