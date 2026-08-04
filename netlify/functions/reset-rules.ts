// netlify/functions/reset-rules.ts
// 一键清理小类累积的"学习规则"（rules 数组）
// 主要用于清除早期 bug 累积的脏规则（如"参考"待整理"的特征 → ..."这种）
//
// POST /api/reset-rules
// body: {
//   mode: 'all' | 'bug'  // all = 清空所有；bug = 只清疑似 bug 的（占位标题累积的）
//   dryRun: true/false   // 只统计不实际改
// }
//
// 响应:
//   {
//     mode, dryRun,
//     totalRules,        // 总规则数
//     bugRules,          // 疑似 bug 规则数
//     clearedRules,      // 实际清掉的规则数
//     clearedItems,      // [{ categoryId, rule }, ...] 最多 50 条
//   }

import { Handler } from '@netlify/functions';
import { loadData, saveData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';

// 判定为"疑似 bug 规则"的关键词——这些是 AI 之前因为标题是占位符（"待整理"/"加载中..."/"无标题"）而误累积的
const BUG_KEYWORDS = ['待整理', '加载中', '无标题', 'undefined', 'null', 'untitled'];

function isBugRule(rule: string): boolean {
  return BUG_KEYWORDS.some(kw => rule.includes(kw));
}

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  let body: any = {};
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const mode = body.mode === 'all' ? 'all' : 'bug';  // 默认 bug（保守）
  const dryRun = !!body.dryRun;

  try {
    const data = await loadData();

    // 统计
    let totalRules = 0;
    let bugRules = 0;
    const allBugList: { categoryId: string; categoryName: string; rule: string }[] = [];

    for (const cat of data.categories) {
      const rules = cat.rules || [];
      totalRules += rules.length;
      for (const r of rules) {
        if (isBugRule(r)) {
          bugRules++;
          allBugList.push({ categoryId: cat.id, categoryName: cat.name, rule: r });
        }
      }
    }

    // 实际清理
    let clearedRules = 0;
    const clearedItems: typeof allBugList = [];
    if (!dryRun) {
      for (const cat of data.categories) {
        if (!cat.rules || cat.rules.length === 0) continue;
        const kept: string[] = [];
        for (const r of cat.rules) {
          const isBug = isBugRule(r);
          if (mode === 'all' || isBug) {
            clearedRules++;
            if (clearedItems.length < 50) {
              clearedItems.push({ categoryId: cat.id, categoryName: cat.name, rule: r });
            }
          } else {
            kept.push(r);
          }
        }
        if (kept.length === 0) {
          delete cat.rules;
        } else {
          cat.rules = kept;
        }
      }
      if (clearedRules > 0) {
        await saveData(data);
      }
    }

    return jsonResponse({
      success: true,
      mode,
      dryRun,
      totalRules,
      bugRules,
      clearedRules,
      clearedItems,
      message: dryRun
        ? `检测到 ${bugRules} 条疑似 bug 规则（共 ${totalRules} 条）`
        : (clearedRules > 0
            ? `✓ 已清掉 ${clearedRules} 条规则`
            : '没有需要清掉的规则'),
    });
  } catch (e: any) {
    console.error('[reset-rules] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
