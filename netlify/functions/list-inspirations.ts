// netlify/functions/list-inspirations.ts
// 列出灵感（支持筛选）

import { Handler } from '@netlify/functions';
import { listInspirations } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });

  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  const params = event.queryStringParameters || {};

  const list = await listInspirations({
    subCategory: params.subCategory,
    venueType: params.venueType,
    status: params.status,
    platform: params.platform,
    keyword: params.keyword,
  });

  return jsonResponse({
    success: true,
    total: list.length,
    inspirations: list,
  });
};

export { handler };
