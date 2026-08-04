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

  return jsonResponse({
    success: true,
    total: list.length,
    inspirations: list,
  });
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
