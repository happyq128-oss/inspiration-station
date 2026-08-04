// netlify/functions/update-inspiration.ts
// 更新一条灵感
// 支持：
//   1. 修改小类 / 展馆类型
//   2. 如果用户修正了 AI 建议，自动累积规则到小类描述

import { Handler } from '@netlify/functions';
import { updateInspiration, loadData, saveData } from './lib/storage';
import { Inspiration, SubCategory } from './lib/types';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

const ALLOWED_FIELDS = [
  'title', 'subCategories', 'subCategoryNames',
  'venueType', 'venueTypeName',
  'status', 'userNote', 'tags', 'description',
];

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
    return errorResponse('Method not allowed', 405);
  }
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const { id, learnFromCorrection, ...patch } = body;

    if (!id) return errorResponse('Missing id');

    const data = await loadData();
    const existing = data.inspirations[id];
    if (!existing) return errorResponse('Inspiration not found', 404);

    // 过滤允许的字段
    const safePatch: any = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in patch) safePatch[key] = patch[key];
    }

    // 如果设置了 subCategories（数组），补全 subCategoryNames
    if (Array.isArray(safePatch.subCategories) && (!Array.isArray(safePatch.subCategoryNames) || safePatch.subCategoryNames.length !== safePatch.subCategories.length)) {
      safePatch.subCategoryNames = safePatch.subCategories
        .map((id: string) => data.categories.find(c => c.id === id)?.name)
        .filter(Boolean);
      // 过滤非法 id
      safePatch.subCategories = safePatch.subCategories.filter((id: string) =>
        data.categories.some(c => c.id === id)
      );
    }
    // 兼容老 API（单个 subCategory 字符串）
    if (typeof safePatch.subCategory === 'string' && !safePatch.subCategories) {
      const id = safePatch.subCategory;
      const cat = data.categories.find(c => c.id === id);
      if (cat) {
        safePatch.subCategories = [id];
        safePatch.subCategoryNames = [cat.name];
      }
      delete safePatch.subCategory;
      delete safePatch.subCategoryName;
    }
    // 如果设置了 venueType，补全 name
    if (safePatch.venueType && !safePatch.venueTypeName) {
      const venue = data.venueTypes.find(v => v.id === safePatch.venueType);
      if (venue) safePatch.venueTypeName = venue.name;
    }

    // 确认时记录时间
    if (safePatch.status && safePatch.status !== 'pending') {
      safePatch.confirmedAt = new Date().toISOString();
    }

    // 【自动学习】用户修正了 AI 建议时，累积规则到小类
    if (learnFromCorrection) {
      const oldSub = existing.aiSuggestion?.subCategories || [];
      const newSub = safePatch.subCategories || existing.subCategories || [];

      // 取新增的 subCategory（不在 AI 建议里的）
      const addedSubs = newSub.filter(s => !oldSub.includes(s));

      if (addedSubs.length > 0) {
        for (const addedId of addedSubs) {
          const newCat = data.categories.find(c => c.id === addedId);
          if (!newCat) continue;
          // 生成规则
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
        await saveData(data);
        console.log(`[learn] Updated ${addedSubs.length} rules`);
      }
    }

    const updated = await updateInspiration(id, safePatch);
    if (!updated) return errorResponse('Update failed', 500);

    return jsonResponse({ success: true, inspiration: updated });
  } catch (e: any) {
    return errorResponse(e.message || 'Internal error', 500);
  }
};

/**
 * 从用户修正里生成规则
 * 比如：AI 说"装置"，用户改"新材料"
 * 生成："含金属编织的展品 → 新材料"
 */
function generateRule(insp: Inspiration, newCat: SubCategory): string | null {
  // 简化规则：直接用标题
  if (insp.title && insp.title.length < 30 && insp.title !== '无标题' && insp.title !== '加载中...' && insp.title !== '待整理') {
    return `类似"${insp.title}"的素材 → ${newCat.name}`;
  }

  return `参考"${(insp.title || '未命名').slice(0, 20)}"的特征 → ${newCat.name}`;
}

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
