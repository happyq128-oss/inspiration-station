// netlify/functions/lib/embedding.ts
// 文本向量化：Qwen text-embedding-v3
// 用于"帮你找"功能——把用户描述和灵感视觉描述都编码成 1024 维向量，做 cosine 相似度

const QWEN_EMBEDDING_API = 'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings';
const MODEL = 'text-embedding-v3';
const DIM = 1024;

interface EmbeddingResult {
  vector: number[];
  tokens: number;
}

/**
 * 编码一段文本为 1024 维向量
 * - 单条输入，限长 2048 token
 * - 失败时返回 null（不抛异常，方便上层降级）
 */
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    console.warn('[embed] QWEN_API_KEY not configured');
    return null;
  }
  if (!text || !text.trim()) return null;

  try {
    const res = await fetch(QWEN_EMBEDDING_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: text.trim().slice(0, 6000), // 保险截断
        dimensions: DIM,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[embed] API error ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data: any = await res.json();
    const vec: number[] | undefined = data?.data?.[0]?.embedding;
    if (!vec || !Array.isArray(vec) || vec.length !== DIM) {
      console.error(`[embed] unexpected vector shape: ${vec?.length || 0}`);
      return null;
    }
    return vec;
  } catch (e: any) {
    console.error(`[embed] fetch error: ${e.message}`);
    return null;
  }
}

/**
 * 批量编码：每批最多 10 条
 * 返回的 vector 顺序与输入一致
 */
export async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) return texts.map(() => null);
  const valid = texts.map(t => (t || '').trim().slice(0, 6000));
  if (valid.every(t => !t)) return texts.map(() => null);

  try {
    const res = await fetch(QWEN_EMBEDDING_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: valid,
        dimensions: DIM,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[embed batch] API error ${res.status}: ${errText.slice(0, 200)}`);
      return texts.map(() => null);
    }

    const data: any = await res.json();
    const list: any[] = data?.data || [];
    if (list.length !== texts.length) {
      console.error(`[embed batch] length mismatch: input=${texts.length}, got=${list.length}`);
      return texts.map(() => null);
    }
    return list.map(d => {
      const v: number[] | undefined = d?.embedding;
      if (!v || v.length !== DIM) return null;
      return v;
    });
  } catch (e: any) {
    console.error(`[embed batch] fetch error: ${e.message}`);
    return texts.map(() => null);
  }
}

/**
 * 把灵感的"可搜索文本"拼起来
 * 优先级：visualDescription（最重要） > visualTags > title > subCategoryNames > venueTypeName
 */
export function buildSearchableText(insp: {
  visualDescription?: string;
  visualTags?: string[];
  title?: string;
  subCategoryNames?: string[];
  venueTypeName?: string;
  aiSuggestion?: {
    visualDescription?: string;
    visualTags?: string[];
  };
}): string {
  const parts: string[] = [];

  // 优先用 inspiration 自己存的；没有就回退 aiSuggestion
  const vd = insp.visualDescription || insp.aiSuggestion?.visualDescription;
  const vt = insp.visualTags || insp.aiSuggestion?.visualTags;

  if (vd) parts.push(vd);
  if (vt && vt.length > 0) parts.push(vt.join('，'));

  // 标题（用非占位的）
  const title = insp.title;
  if (title && title !== '待整理' && title !== '无标题' && title !== '加载中...') {
    parts.push(title);
  }

  // 分类作为强信号
  if (insp.subCategoryNames && insp.subCategoryNames.length > 0) {
    parts.push(`形式：${insp.subCategoryNames.join('、')}`);
  }
  if (insp.venueTypeName) {
    parts.push(`展馆类型：${insp.venueTypeName}`);
  }

  return parts.join('。');
}

/**
 * Cosine 相似度（两个 1024 维向量）
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export { DIM as EMBEDDING_DIM };
