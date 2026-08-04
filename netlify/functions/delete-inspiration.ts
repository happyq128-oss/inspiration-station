// netlify/functions/delete-inspiration.ts
// 删除灵感（支持批量）

import { Handler } from '@netlify/functions';
import { deleteInspiration } from './lib/storage';
import { loadData, saveData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return errorResponse('Method not allowed', 405);
  }
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse('ids must be non-empty array');
    }

    const data = await loadData();
    let deleted = 0;
    for (const id of ids) {
      if (data.inspirations[id]) {
        delete data.inspirations[id];
        deleted++;
      }
    }
    await saveData(data);

    return jsonResponse({ success: true, deleted });
  } catch (e: any) {
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
