// netlify/functions/manage-categories.ts
// 小类库管理（形式小类 + 展馆类型）

import { Handler } from '@netlify/functions';
import { loadData, saveData } from './lib/storage';
import { SubCategory, VenueType, DEFAULT_CATEGORIES, DEFAULT_VENUE_TYPES } from './lib/types';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  const data = await loadData();

  // GET: 列出所有小类
  if (event.httpMethod === 'GET') {
    return jsonResponse({
      success: true,
      categories: data.categories || DEFAULT_CATEGORIES,
      venueTypes: data.venueTypes || DEFAULT_VENUE_TYPES,
    });
  }

  // POST: 更新
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { categories, venueTypes } = body;

      if (Array.isArray(categories)) {
        for (const c of categories) {
          if (!c.id || !c.name) return errorResponse('Each category must have id and name');
        }
        data.categories = categories;
      }

      if (Array.isArray(venueTypes)) {
        for (const v of venueTypes) {
          if (!v.id || !v.name) return errorResponse('Each venueType must have id and name');
        }
        data.venueTypes = venueTypes;
      }

      await saveData(data);
      return jsonResponse({
        success: true,
        categories: data.categories,
        venueTypes: data.venueTypes,
      });
    } catch (e: any) {
      return errorResponse(e.message, 500);
    }
  }

  return errorResponse('Method not allowed', 405);
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
