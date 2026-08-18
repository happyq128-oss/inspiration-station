// netlify/functions/batch-confirm.ts
// 批量确认：一次保存 1-4 条灵感的调整
// POST /api/batch-confirm
// body: { items: [{ id, subCategories, subCategoryNames, venueType, venueTypeName, status, tags, userNote, learnFromCorrection }] }

import { Handler } from '@netlify/functions';
import { updateInspiration, loadData, saveData } from './lib/storage';
import { Inspiration, SubCategory } from './lib/types';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const items: any[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) return errorResponse('items 不能为空');
    if (items.length > 10) return errorResponse('一次最多 10 条');

    const data = await loadData();
    const results: any[] = [];

    for (const item of items) {
      const id = item.id;
      if (!id) {
        results.push({ id: null, ok: false, error: '缺少 id' });
        continue;
      }
      const existing = data.inspirations[id];
      if (!existing) {
        results.push({ id, ok: false, error: '灵感不存在' });
        continue;
      }

      // 构造 patch
      const patch: Partial<Inspiration> = {};
      if (Array.isArray(item.subCategories)) {
        patch.subCategories = item.subCategories.filter((id: string) =>
          data.categories.some(c => c.id === id)
        );
        patch.subCategoryNames = item.subCategories.map((id: string) =>
          data.categories.find(c => c.id === id)?.name || id
        ).filter(Boolean);
      }
      if (item.venueType) {
        patch.venueType = item.venueType;
        patch.venueTypeName = data.venueTypes.find(v => v.id === item.venueType)?.name || item.venueType;
      }
      if (item.status) patch.status = item.status;
      if (Array.isArray(item.tags)) patch.tags = item.tags;
      if (typeof item.userNote === 'string') patch.userNote = item.userNote;
      if (typeof item.title === 'string') patch.title = item.title;

      if (patch.status && patch.status !== 'pending') {
        patch.confirmedAt = new Date().toISOString();
      }

      // 【自动学习】用户修正 AI 建议时累积规则
      if (item.learnFromCorrection) {
        const oldSub = existing.aiSuggestion?.subCategories || [];
        const newSub = patch.subCategories || existing.subCategories || [];
        const addedSubs = newSub.filter(s => !oldSub.includes(s));
        for (const addedId of addedSubs) {
          const newCat = data.categories.find(c => c.id === addedId);
          if (!newCat) continue;
          const rule = generateRule(existing, newCat);
          if (rule) {
            const catIdx = data.categories.findIndex(c => c.id === newCat.id);
            if (catIdx >= 0) {
              const updatedCat: SubCategory = {
                ...data.categories[catIdx],
                rules: [...(data.categories[catIdx].rules || []), rule].slice(-20),
              };
              data.categories[catIdx] = updatedCat;
            }
          }
        }
      }

      const updated = await updateInspiration(id, patch);
      if (updated) {
        results.push({ id, ok: true });
      } else {
        results.push({ id, ok: false, error: '保存失败' });
      }
    }

    // 如果有学习规则更新，保存 categories
    const hasRuleUpdates = items.some(i => i.learnFromCorrection);
    if (hasRuleUpdates) {
      await saveData(data);
    }

    return jsonResponse({
      success: true,
      results,
      saved: results.filter(r => r.ok).length,
      failed: results.filter(r => !r.ok).length,
    });
  } catch (e: any) {
    console.error('[batch-confirm] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

function generateRule(insp: Inspiration, newCat: SubCategory): string | null {
  if (insp.title && insp.title.length < 30 && insp.title !== '无标题' && insp.title !== '加载中...' && insp.title !== '待整理') {
    return `类似"${insp.title}"的素材 → ${newCat.name}`;
  }
  return `参考"${(insp.title || '未命名').slice(0, 20)}"的特征 → ${newCat.name}`;
}

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
