// netlify/functions/update-inspiration.ts
// 更新一条灵感
// 支持：
//   1. 修改小类 / 展馆类型
//   2. 如果用户修正了 AI 建议，自动累积规则到小类描述

import { Handler } from '@netlify/functions';
import { updateInspiration, loadData, saveData } from './lib/storage';
import { Inspiration, SubCategory } from './lib/types';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';

const ALLOWED_FIELDS = [
  'title', 'subCategory', 'subCategoryName',
  'venueType', 'venueTypeName',
  'status', 'userNote', 'tags', 'description',
];

const handler: Handler = async (event) => {
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

    // 如果设置了 subCategory，补全 name
    if (safePatch.subCategory && !safePatch.subCategoryName) {
      const cat = data.categories.find(c => c.id === safePatch.subCategory);
      if (cat) safePatch.subCategoryName = cat.name;
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
      const oldSub = existing.aiSuggestion?.subCategory;
      const newSub = safePatch.subCategory || existing.subCategory;

      if (oldSub && newSub && oldSub !== newSub) {
        const oldCat = data.categories.find(c => c.id === oldSub);
        const newCat = data.categories.find(c => c.id === newSub);

        if (oldCat && newCat) {
          // 生成规则："X类的东西应归Y类"
          // 但更智能：基于标题提取特征
          const rule = generateRule(existing, oldCat, newCat);
          if (rule) {
            // 追加到新小类的 rules（限制最多 20 条）
            const catIdx = data.categories.findIndex(c => c.id === newCat.id);
            if (catIdx >= 0) {
              const updatedCat: SubCategory = {
                ...data.categories[catIdx],
                rules: [...(data.categories[catIdx].rules || []), rule].slice(-20),
              };
              data.categories[catIdx] = updatedCat;
              await saveData(data);
              console.log(`[learn] Added rule to ${newCat.name}: ${rule}`);
            }
          }
        }
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
function generateRule(insp: Inspiration, oldCat: SubCategory, newCat: SubCategory): string | null {
  const signals: string[] = [];

  // 从标题提取关键词（去掉通用词）
  const titleWords = (insp.title || '').replace(/[，。、！？：；,.!?;:]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  // 找特征词（2-6 个字的短语）
  const keywords = titleWords.filter(w => w.length >= 2 && w.length <= 8);
  if (keywords.length > 0) {
    signals.push(`含"${keywords.slice(0, 2).join('"或"')}"的`);
  }

  // 简化规则：直接用标题
  if (insp.title && insp.title.length < 30) {
    return `类似"${insp.title}"的素材 → ${newCat.name}`;
  }

  if (signals.length > 0) {
    return `${signals.join('')}素材 → ${newCat.name}`;
  }

  return `参考"${(insp.title || '未命名').slice(0, 20)}"的特征 → ${newCat.name}`;
}

export { handler };
