// netlify/functions/get-stats.ts
// 数据概览（首页用）

import { Handler } from '@netlify/functions';
import { loadData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  const data = await loadData();
  const list = Object.values(data.inspirations);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const total = list.length;

  const byStatus = {
    pending: list.filter(i => i.status === 'pending').length,
    organized: list.filter(i => i.status === 'organized').length,
    used: list.filter(i => i.status === 'used').length,
  };

  // 形式小类分布
  const byCategory: Record<string, number> = {};
  for (const c of data.categories) byCategory[c.id] = 0;
  for (const i of list) {
    const key = i.subCategory || 'uncategorized';
    byCategory[key] = (byCategory[key] || 0) + 1;
  }

  // 展馆类型分布
  const byVenueType: Record<string, number> = {};
  for (const v of data.venueTypes) byVenueType[v.id] = 0;
  for (const i of list) {
    const key = i.venueType || 'unspecified';
    byVenueType[key] = (byVenueType[key] || 0) + 1;
  }

  // 平台分布
  const byPlatform: Record<string, number> = {
    xiaohongshu: 0, douyin: 0, huaban: 0, other: 0,
  };
  for (const i of list) {
    byPlatform[i.platform] = (byPlatform[i.platform] || 0) + 1;
  }

  // 时间趋势
  const last7Days: { date: string; count: number }[] = [];
  for (let d = 6; d >= 0; d--) {
    const day = new Date(now - d * dayMs);
    const dateStr = day.toISOString().slice(0, 10);
    const count = list.filter(i => i.createdAt.slice(0, 10) === dateStr).length;
    last7Days.push({ date: dateStr, count });
  }

  const last30Days = list.filter(i => {
    const t = new Date(i.createdAt).getTime();
    return now - t <= 30 * dayMs;
  }).length;

  const pendingConfirm = list.filter(i => i.status === 'pending' && i.aiSuggestion).length;
  const lowConfidence = list.filter(i => i.aiSuggestion && i.aiSuggestion.confidence < 60).length;

  return jsonResponse({
    success: true,
    stats: {
      total,
      byStatus,
      byCategory,
      byVenueType,
      byPlatform,
      last7Days,
      last30Days,
      pendingConfirm,
      lowConfidence,
    },
    categories: data.categories,
    venueTypes: data.venueTypes,
  });
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
