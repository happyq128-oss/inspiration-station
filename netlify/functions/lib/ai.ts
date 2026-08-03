// netlify/functions/lib/ai.ts
// AI 预归类：调用通义千问 Qwen-VL（多模态）
// 支持双维度分类：形式小类 + 展馆类型
// 注入用户自定义规则（不费 token，规则放在 prompt 描述里）

import { AIClassification, DEFAULT_CATEGORIES, DEFAULT_VENUE_TYPES, SubCategory, VenueType } from './types';

const QWEN_API = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

interface AIInput {
  title: string;
  description?: string;
  coverImage?: string;
  imageBase64?: string;
  platform: string;
  categories: SubCategory[];        // 注入
  venueTypes: VenueType[];          // 注入
}

function buildSystemPrompt(categories: SubCategory[], venueTypes: VenueType[]): string {
  const categoryDesc = categories.map(c => {
    let desc = `- **${c.id}（${c.name}）**：${c.description || ''}`;
    if (c.rules && c.rules.length > 0) {
      desc += `\n  📌 用户规则：${c.rules.slice(-5).join('；')}`;  // 只取最近 5 条
    }
    return desc;
  }).join('\n');

  const venueDesc = venueTypes.map(v =>
    `- **${v.id}（${v.name}）**：${v.description || ''}`
  ).join('\n');

  return `你是展陈（展览陈列）行业的资深策展人助理，专门帮策展人快速判断"看到的素材"属于哪个分类。

你需要从以下【形式小类】和【展馆类型】两个维度分别选一个：

【形式小类】（必须选一个）：
${categoryDesc}

【展馆类型】（必须选一个）：
${venueDesc}

**判断要点**：
- 形式小类：重点看"视觉形式"而非"主题内容"——根据图片的视觉特征判断
- 展馆类型：根据图片的应用场景判断（博物馆风格、纪念馆风格、企业馆风格有明显差异）
- **严格遵守用户规则**——如果用户对该小类有补充规则，按规则分类
- 如果不确定，给出最可能的类别，置信度低一些
- 必须只返回 JSON 格式，不要任何解释

返回格式示例：
{"category": "installation", "venueType": "museum", "confidence": 85, "reasoning": "图中是大型空间悬挂装置，符合装置类定义，博物馆风格明显"}`;
}

export async function aiClassify(input: AIInput): Promise<AIClassification> {
  const qwenKey = process.env.QWEN_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;

  if (!qwenKey && !deepseekKey) {
    return defaultClassification('未配置 AI Key');
  }

  const categories = input.categories && input.categories.length > 0
    ? input.categories
    : DEFAULT_CATEGORIES;
  const venueTypes = input.venueTypes && input.venueTypes.length > 0
    ? input.venueTypes
    : DEFAULT_VENUE_TYPES;

  // 信息太少时直接降级
  if (!input.title && !input.description && !input.imageBase64) {
    return defaultClassification('信息不足');
  }

  const useQwen = !!qwenKey;
  const apiUrl = useQwen ? QWEN_API : DEEPSEEK_API;
  const apiKey = useQwen ? qwenKey : deepseekKey;
  const model = (useQwen && input.imageBase64) ? 'qwen-vl-max' : (useQwen ? 'qwen-plus' : 'deepseek-chat');

  const systemPrompt = buildSystemPrompt(categories, venueTypes);

  const textContent = [
    `平台：${input.platform}`,
    input.title ? `标题：${input.title}` : '',
    input.description ? `描述：${input.description}` : '',
  ].filter(Boolean).join('\n');

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (input.imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: textContent || '请看图判断：' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${input.imageBase64}` } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: textContent });
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`AI API error: ${res.status} - ${errText.slice(0, 200)}`);
      return defaultClassification('AI 调用失败');
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return defaultClassification('AI 返回为空');

    const parsed = JSON.parse(content);
    const cat = categories.find(c => c.id === parsed.category);
    const venue = venueTypes.find(v => v.id === parsed.venueType);

    return {
      subCategory: cat?.id || categories[0].id,
      subCategoryName: cat?.name || categories[0].name,
      venueType: venue?.id || venueTypes[0].id,
      venueTypeName: venue?.name || venueTypes[0].name,
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      reasoning: parsed.reasoning || '',
    };
  } catch (e: any) {
    console.error('AI classify error:', e);
    return defaultClassification('AI 调用异常');
  }
}

function defaultClassification(reason: string): AIClassification {
  return {
    subCategory: 'multimedia',
    subCategoryName: '多媒体',
    venueType: 'museum',
    venueTypeName: '博物馆',
    confidence: 0,
    reasoning: reason + '，需要手动分类',
  };
}
