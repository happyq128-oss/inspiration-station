// netlify/functions/search-by-description.ts
// "帮你找"功能：用户输入一段描述，AI 在灵感库里找最匹配的 Top N
// POST /api/search-by-description
// body: { query: string, topK?: number, venueType?: string, subCategory?: string }
// 返回：[{ id, title, coverImage, url, platform, subCategoryNames, venueTypeName, visualDescription, similarity }]

import { Handler } from '@netlify/functions';
import { loadData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';
import { withContext } from './lib/handler';
import {
  embedText,
  embedBatch,
  buildSearchableText,
  cosineSimilarity,
  EMBEDDING_DIM,
} from './lib/embedding';
import { Inspiration } from './lib/types';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (event.httpMethod !== 'POST') return errorResponse('Method not allowed', 405);
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  try {
    const body = JSON.parse(event.body || '{}');
    const query = (body.query || '').trim();
    const topK = Math.min(20, Math.max(1, Number(body.topK) || 10));
    const filterVenue = body.venueType || '';
    const filterSub = body.subCategory || '';

    if (!query) return errorResponse('query 不能为空');
    if (query.length > 500) return errorResponse('query 太长（≤500 字）');

    const t0 = Date.now();
    const data = await loadData();
    let list: Inspiration[] = Object.values(data.inspirations);

    // 过滤：有 visualDescription 的才参与（没描述的没法做语义搜索）
    // 可选再叠加 venueType / subCategory 过滤
    if (filterVenue) list = list.filter(i => i.venueType === filterVenue);
    if (filterSub) {
      list = list.filter(i =>
        (i.subCategories || []).includes(filterSub) ||
        (i.aiSuggestion?.subCategories || []).includes(filterSub)
      );
    }
    list = list.filter(i => {
      const text = buildSearchableText(i);
      return text.length > 0;
    });

    if (list.length === 0) {
      return jsonResponse({
        success: true,
        query,
        topK,
        results: [],
        message: '灵感库里还没有可搜索的素材（需要先有 visualDescription）',
        duration: Date.now() - t0,
      });
    }

    console.log(`[find] query="${query.slice(0, 30)}", candidates=${list.length}, topK=${topK}`);

    // Step 1: 编码 query
    const queryVec = await embedText(query);
    if (!queryVec) {
      return errorResponse('编码失败（Qwen embedding API 调用出错）', 502);
    }
    console.log(`[find] query embedded: ${Date.now() - t0}ms`);

    // Step 2: 收集所有候选的可搜索文本 + 已有 embedding
    const texts: string[] = [];
    const haveVec: (number[] | null)[] = [];
    for (const i of list) {
      texts.push(buildSearchableText(i));
      haveVec.push(Array.isArray(i.visualEmbedding) && i.visualEmbedding.length === EMBEDDING_DIM
        ? i.visualEmbedding
        : null);
    }

    // Step 3: 补算缺失的 embedding（一次批量调用）
    const missingIdx: number[] = [];
    for (let k = 0; k < haveVec.length; k++) {
      if (!haveVec[k]) missingIdx.push(k);
    }

    if (missingIdx.length > 0) {
      const missingTexts = missingIdx.map(k => texts[k]);
      console.log(`[find] computing ${missingIdx.length} missing embeddings...`);
      const vectors = await embedBatch(missingTexts);
      for (let m = 0; m < missingIdx.length; m++) {
        haveVec[missingIdx[m]] = vectors[m];
      }
    }
    console.log(`[find] all embedded: ${Date.now() - t0}ms`);

    // Step 4: 算相似度
    const scored = list.map((insp, idx) => {
      const v = haveVec[idx];
      const sim = v ? cosineSimilarity(queryVec, v) : 0;
      return { insp, similarity: sim };
    });

    // Step 5: 排序 + 截 topK
    scored.sort((a, b) => b.similarity - a.similarity);
    const top = scored.slice(0, topK);

    // Step 6: 返回
    const results = top.map(({ insp, similarity }) => ({
      id: insp.id,
      title: insp.title,
      url: insp.url,
      platform: insp.platform,
      coverImage: insp.coverImage,
      subCategoryNames: insp.subCategoryNames || insp.aiSuggestion?.subCategoryNames || [],
      venueTypeName: insp.venueTypeName || insp.aiSuggestion?.venueTypeName || '',
      visualDescription: insp.visualDescription || insp.aiSuggestion?.visualDescription || '',
      visualTags: insp.visualTags || insp.aiSuggestion?.visualTags || [],
      similarity: Math.round(similarity * 1000) / 1000,  // 保留 3 位小数
    }));

    return jsonResponse({
      success: true,
      query,
      topK,
      totalCandidates: list.length,
      computedNow: missingIdx.length,  // 这次现算的 embedding 数
      results,
      duration: Date.now() - t0,
    });
  } catch (e: any) {
    console.error('[find] error:', e);
    return errorResponse(e.message || 'Internal error', 500);
  }
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
