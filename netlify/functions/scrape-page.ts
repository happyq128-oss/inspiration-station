// netlify/functions/scrape-page.ts
// 手动触发抓取 + AI 重分类

import { Handler } from '@netlify/functions';
import { scrapePage } from './lib/scraper';
import { aiClassify } from './lib/ai';
import { updateInspiration, loadData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const { id } = body;
    if (!id) return errorResponse('Missing id');

    const data = await loadData();
    const insp = data.inspirations[id];
    if (!insp) return errorResponse('Inspiration not found', 404);

    const scraped = await scrapePage(insp.url);
    const aiResult = await aiClassify({
      title: scraped.title || insp.title,
      description: scraped.description,
      coverImage: scraped.coverImage,
      platform: insp.platform,
      categories: data.categories,
      venueTypes: data.venueTypes,
    });

    const updated = await updateInspiration(id, {
      title: scraped.title || insp.title,
      description: scraped.description,
      coverImage: scraped.coverImage,
      aiSuggestion: aiResult,
      updatedAt: new Date().toISOString(),
    });

    return jsonResponse({ success: true, inspiration: updated });
  } catch (e: any) {
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
