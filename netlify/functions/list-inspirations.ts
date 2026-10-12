// netlify/functions/list-inspirations.ts
// 列出灵感（支持筛选）

import { Handler } from '@netlify/functions';
import { listInspirations } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });

  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  const params = event.queryStringParameters || {};

  const list = await listInspirations({
    subCategory: params.subCategory,
    venueType: params.venueType,
    status: params.status,
    platform: params.platform,
    keyword: params.keyword,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  // 精简响应：去掉大字段，避免 Netlify Function 6MB / 10s 超时
  // - visualEmbedding: 1024 维 float 数组，每条约 10KB，"AI 找图" 用时单独查
  // - aiSuggestion.visualEmbedding: 同理
  const slim = list.map(({ visualEmbedding: _ve, aiSuggestion, ...rest }) => {
    if (aiSuggestion) {
      const { visualEmbedding: _aie, ...aiRest } = aiSuggestion;
      return { ...rest, aiSuggestion: aiRest };
    }
    return rest;
  });

  return jsonResponse({
    success: true,
    total: list.length,
    inspirations: slim,
  });
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
