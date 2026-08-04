// netlify/functions/lib/ai.ts
// AI 预归类：调用通义千问 Qwen-VL（多模态）
// 支持双维度分类：形式小类 + 展馆类型
// 注入用户自定义规则（不费 token，规则放在 prompt 描述里）

import { AIClassification, DEFAULT_CATEGORIES, DEFAULT_VENUE_TYPES, SubCategory, VenueType } from './types';
import { getImage } from './storage';
import sharp from 'sharp';

const QWEN_API = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

interface AIInput {
  title: string;
  description?: string;
  coverImage?: string;        // 图片 URL（Qwen-VL 支持 https URL）
  imageBase64?: string;       // 兼容老 API
  platform: string;
  categories: SubCategory[];        // 注入
  venueTypes: VenueType[];          // 注入
}

function buildSystemPrompt(categories: SubCategory[], venueTypes: VenueType[]): string {
  // 用户当前分类库（仅作 fallback，优先级低于下面的硬编码判断标准）
  const categoryLib = categories.map(c => {
    let desc = `- **${c.id}（${c.name}）**：${c.description || ''}`;
    if (c.rules && c.rules.length > 0) {
      desc += `\n  📌 用户规则：${c.rules.slice(-5).join('；')}`;  // 只取最近 5 条
    }
    return desc;
  }).join('\n');

  const venueLib = venueTypes.map(v =>
    `- **${v.id}（${v.name}）**：${v.description || ''}`
  ).join('\n');

  return `你是展陈（展览陈列）行业的资深策展人助理，帮策展人快速判断"看到的素材"属于哪些分类。

⚠️⚠️⚠️ 强制硬规则（违反任何一个 = 错误判断）⚠️⚠️⚠️
1. **必须真的看图**：仅靠标题/平台/常识猜测 = 错误。看到图里有什么，就基于什么判断。
2. **占位标题警告**：如果标题是"待整理"/"加载中..."/"无标题"等占位符，**等同于无标题**——不要从这些词推断内容（它们没有信息量）。同理平台="other"或没有平台信息时，不要用"小红书都是企业宣传"这种偏见。
3. **视觉特征是唯一可信信号**：标题只用于辅助理解（看到"科布伦茨州立博物馆"这种实词才有用），平台、标签都是次要的。
4. **不确定就降 confidence**：宁可 confidence 给 30-50 标"待确认"，也不要硬猜一个错答案。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【任务】从【形式小类】+【展馆类型】两个维度判断
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【形式小类判断标准】(6 类，可多选，建议 1-3 个)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **multimedia（多媒体）**
   视觉特征：能看到明显主体使用了 LED 屏、投影、灯光互动等声光电技术；整体画面炫酷、有动态光影。
   强信号：画面明显有屏幕/光束/光斑/动态元素。

2. **installation（装置）**
   视觉特征：图片聚焦核心为造型复杂或夸张的装置；常使用阵列手法（重复、组合、规模化）；地形沙盘也归此类。
   强信号：画面中心是一个被聚焦的、造型化的实体作品（非屏幕）。

3. **material（新材料）**
   视觉特征：整体画面较难看出重点，但某处使用的材质较为特殊。
   典型材质：玻璃、岩板、杜邦纸、穿孔板、亚克力、夯土、镜面、金属网、特殊涂料、新型织物。
   ⚠️ 重要：material 是"兜底类"——**只在主体不清晰、无法用其他主标签表达时才用**；一旦有清晰主体（LED 屏、装置、展品），按主体分类。

4. **layout（版面）**
   视觉特征：图片中没有绝对的核心主视觉，能看到一段或多个墙面的排版；有亮眼的版面配色或特殊的版面造型（圆形、三角形、异形等）。
   强信号：画面是连续的、铺满墙面的图文组合。

5. **space（特殊空间处理）**
   视觉特征：空间非普通常规比例的四方空间；特征包括：顶部穹顶、空间有柱子、长走廊、跃层、夹层、悬挑。
   强信号：建筑空间本身是"主角"，而不是装饰。

6. **display（展柜柜内设计）**
   视觉特征：图片中可以看到明显的展柜；重点关注柜内文物/展品的摆放方式、灯光布置、背景衬板、立体场景。
   强信号：能看到展柜玻璃 + 柜内展品的组合。

【多选与边界规则】
- 一个素材可同时属于多个形式，鼓励识别 1-3 个；按"主导视觉"排序，最主要的放第一个
- **LED 屏造型特殊**：可以同时打"多媒体"+"装置"（多选）
- **不要把 6 个标签全打上**——宁可少而准（一般 1-3 个）
- 版面 vs 展柜柜内设计：
  - 展柜玻璃 + 柜内展品组合 → display
  - 展柜外的展墙图文 → layout

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【展馆类型判断标准】(3 类，单选)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **museum（博物馆）**
   主题：展现某城市/地区/某主题文化从古至今的发展史。
   **【第一判断·图文内容】**：看到**文物、考古标本、模型、文献、展柜陈列物**等多为博物馆。
   **【第二判断·辅助特征】**：常使用展柜放置；空间相对较暗（聚光照明突出展品）。
   **【中式元素信号】**：看到**卷轴、白墙灰瓦、中式建筑构件**（飞檐、斗拱、雕花窗格、月洞门等）等中式元素，多为博物馆。
   强信号：文物/展品内容 + 暗空间 + 展柜；或明显的中式建筑/装饰元素。

2. **memorial（纪念馆）**
   **【第一判断·图文内容】**：
   - 革命历史类（多数）：墙面版面的图文以**黑白战争/革命相关照片**为主。
   - 人物纪念馆：墙面能看到明显的人物头像（油画、照片、雕塑等）。
   **【第二判断·辅助特征】**：革命历史类版面配色多用红色（红+黑、红+白等）。
   强信号：黑白老照片 / 人物头像 + 红色配色（任一二项即可）。

3. **corporate（企业馆）**
   主题：展示企业文化、品牌历史、产品技术。
   **【第一判断·图文内容】**：看到**企业 Logo、企业活动图、产品图、业务说明 UI/界面、品牌历史图片**等多为企业馆。
   **【第二判断·辅助特征】**：版面配色多用蓝/绿色，搭配白/木/黑灰等中性色；整体简约现代；较多使用金属材质（拉丝不锈钢、铝合金等）。
   强信号：企业产品/业务图 + 蓝/绿/白配色 + 金属材质。

【边界判断优先级】

**第一步：先看图文内容**（决定主判断）
- 看到文物、考古标本、模型、文献、展柜陈列 → 博物馆
- 看到黑白老照片、革命历史照片、人物头像/肖像 → 纪念馆
- 看到企业 Logo、企业产品图、业务说明 UI、品牌历史图片 → 企业馆

**第二步：图文模糊时，看辅助特征**（配色 + 空间光环境）
- 博物馆：暗空间 + 展柜聚光 + 中式元素
- 纪念馆：红+黑 / 红+白 配色
- 企业馆：蓝/绿/白 配色 + 金属材质 + 简约现代风

**实在分不清** → confidence ≤ 50，让用户手动确认

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【当前系统分类库（用户可改，定义补充）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

形式小类：
${categoryLib}

展馆类型：
${venueLib}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【输出格式】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

必须只返回 JSON，不要任何解释：
{"categories": ["multimedia", "installation"], "venueType": "museum", "confidence": 85, "reasoning": "图中是 LED 屏 + 投影组合的互动装置，博物馆暗空间 + 文物展柜风格明显"}

【confidence 指导】
- 90-100：视觉特征非常明确（≥2 个强信号）
- 70-89：有 1-2 个明显特征，可信
- 50-69：特征模糊，可能错判
- 30-49：信息不足，建议人工确认
- 0-29：完全看不清`;
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
  // 关键：只要有图（base64 或 URL），都必须用视觉模型 qwen-vl-max，
  // 否则 qwen-plus / deepseek-chat 是纯文本模型，看不到图
  const hasImage = !!(input.imageBase64 || input.coverImage);
  const model = useQwen
    ? (hasImage ? 'qwen-vl-max' : 'qwen-plus')
    : 'deepseek-chat';

  const t0 = Date.now();
  const systemPrompt = buildSystemPrompt(categories, venueTypes);
  console.log(`[ai] prompt built: ${Date.now() - t0}ms, model=${model}`);

  const textContent = [
    `平台：${input.platform}`,
    input.title ? `标题：${input.title}` : '',
    input.description ? `描述：${input.description}` : '',
  ].filter(Boolean).join('\n');

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
  ];

  // 关键：Qwen-VL 的 multimodal 接口要求图片必须有 Content-Length 头，
  // 但我们自己的 /api/image 走 Netlify Edge / HTTP/2 经常不返回 Content-Length，
  // 会触发 "Missing Content-Length of multimodal" 错误。
  // 解决方案：在我们这边拿到图 buffer → sharp 压到 800px JPEG → base64 → inline 给 Qwen
  let imageBase64ForQwen: string | undefined = input.imageBase64;
  let imageMimeForQwen = 'image/jpeg';

  if (!imageBase64ForQwen && input.coverImage) {
    // 情况 1：coverImage 是 /api/image/{id} 本地路径 → 直接读 Blobs（零网络开销）
    const localMatch = input.coverImage.match(/\/api\/image\/([A-Za-z0-9_]+)/);
    if (localMatch) {
      try {
        const result = await getImage(localMatch[1]);
        if (result) {
          // sharp 压缩：长边 800px / JPEG 70%（<100KB，Qwen 处理快）
          const resized = await sharp(result.buffer)
            .rotate()
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
          imageBase64ForQwen = resized.toString('base64');
          imageMimeForQwen = 'image/jpeg';
          console.log(`[ai] image processed: ${result.buffer.length} -> ${resized.length} bytes`);
        }
      } catch (e: any) {
        console.warn(`[ai] getImage/sharp error: ${e.message}`);
      }
    } else {
      // 情况 2：外部 URL（来自抓取）→ fetch + sharp 压缩
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        const imgRes = await fetch(input.coverImage, { signal: controller.signal });
        clearTimeout(timer);
        if (imgRes.ok) {
          const raw = Buffer.from(await imgRes.arrayBuffer());
          const resized = await sharp(raw)
            .rotate()
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
          imageBase64ForQwen = resized.toString('base64');
          imageMimeForQwen = 'image/jpeg';
        } else {
          console.warn(`[ai] fetch image failed: ${imgRes.status}`);
        }
      } catch (e: any) {
        console.warn(`[ai] fetch image error: ${e.message}`);
      }
    }
  }

  if (imageBase64ForQwen) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: textContent || '请看图判断：' },
        { type: 'image_url', image_url: { url: `data:${imageMimeForQwen};base64,${imageBase64ForQwen}` } },
      ],
    });
  } else if (input.coverImage) {
    // 退化方案：URL 拿不到就用 URL（大概率会触发 Qwen 错误）
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: textContent || '请看图判断：' },
        { type: 'image_url', image_url: { url: input.coverImage } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: textContent });
  }

  try {
    const tApi = Date.now();
    console.log(`[ai] calling ${model}, imageBase64Len=${imageBase64ForQwen?.length || 0}, elapsed ${tApi - t0}ms`);
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
      console.error(`AI API error: ${res.status} - ${errText.slice(0, 500)}`);
      return defaultClassification(`AI ${res.status}: ${errText.slice(0, 100)}`);
    }

    const data: any = await res.json();
    console.log(`[ai] API call done: ${Date.now() - tApi}ms (total ${Date.now() - t0}ms)`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return defaultClassification('AI 返回为空');

    const parsed = JSON.parse(content);
    // 形式小类（多选）— 兼容老 API 返回的 category 单数字段
    let catIds: string[] = [];
    if (Array.isArray(parsed.categories)) {
      catIds = parsed.categories.filter((id: any) => typeof id === 'string');
    } else if (typeof parsed.category === 'string') {
      catIds = [parsed.category];
    }
    // 过滤非法 id
    catIds = catIds.filter((id: string) => categories.some(c => c.id === id));
    if (catIds.length === 0) catIds = [categories[0].id];
    const cats = catIds.map((id: string) => categories.find(c => c.id === id)!);

    const venue = venueTypes.find(v => v.id === parsed.venueType);

    return {
      subCategories: cats.map(c => c.id),
      subCategoryNames: cats.map(c => c.name),
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
    subCategories: ['multimedia'],
    subCategoryNames: ['多媒体'],
    venueType: 'museum',
    venueTypeName: '博物馆',
    confidence: 0,
    reasoning: reason + '，需要手动分类',
  };
}
