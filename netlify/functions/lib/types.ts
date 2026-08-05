// netlify/functions/lib/types.ts
// 共享数据模型定义

export type Platform = 'xiaohongshu' | 'douyin' | 'huaban' | 'other';

export type InspirationStatus = 'pending' | 'organized' | 'used';

// ============ 形式小类（第一个分类维度）============
export interface SubCategory {
  id: string;          // 'multimedia' | 'installation' | ...
  name: string;        // '多媒体' | '装置' | ...
  color: string;       // '#FF6B9D'
  description?: string;  // 用户自定义描述，注入 AI prompt
  rules?: string[];      // 用户修正累积的规则（自动学习）
}

// ============ 展馆类型（第二个分类维度）============
export interface VenueType {
  id: string;          // 'museum' | 'memorial' | 'corporate'
  name: string;        // '博物馆' | '纪念馆' | '企业馆'
  color: string;
  description?: string;
}

// 默认小类库（6 个）
export const DEFAULT_CATEGORIES: SubCategory[] = [
  {
    id: 'multimedia',
    name: '多媒体',
    color: '#FF6B9D',
    description: '声光电、投影、互动装置、AR/VR、数字媒体、影像装置',
  },
  {
    id: 'installation',
    name: '装置',
    color: '#FFD93D',
    description: '空间装置、雕塑、景观、大型沉浸式装置、机械装置',
  },
  {
    id: 'material',
    name: '新材料',
    color: '#4ECDC4',
    description: '新型材料运用、新型工艺、新型展陈材料、特殊表面处理',
  },
  {
    id: 'layout',
    name: '版面',
    color: '#A78BFA',
    description: '平面设计、排版、视觉系统、版式、字体应用、展板',
  },
  {
    id: 'space',
    name: '特殊空间处理',
    color: '#FF9F40',
    description: '柱子的包裹/装饰、跃层空间、楼梯设计、走廊过渡空间、夹层、悬挑',
  },
  {
    id: 'display',
    name: '展柜柜内设计',
    color: '#EC4899',
    description: '展柜内文物/展品的摆放方式、灯光布置、背景衬板、立体场景',
  },
];

// 默认展馆类型（3 个）
export const DEFAULT_VENUE_TYPES: VenueType[] = [
  {
    id: 'museum',
    name: '博物馆',
    color: '#3B82F6',
    description: '文化主题博物馆（历史、艺术、自然科学、行业专题等）',
  },
  {
    id: 'memorial',
    name: '纪念馆',
    color: '#EF4444',
    description: '爱国主义教育纪念馆、红色主题、纪念性展馆',
  },
  {
    id: 'corporate',
    name: '企业馆',
    color: '#10B981',
    description: '企业宣传馆（品牌历史、产品技术、企业文化）',
  },
];

export interface AIClassification {
  // 形式小类（多选）
  subCategories: string[];
  subCategoryNames: string[];
  // 展馆类型
  venueType: string;
  venueTypeName: string;
  confidence: number;
  reasoning?: string;
  // 视觉描述（"帮你找"用：100-150 字画面感描述）
  visualDescription?: string;
  // 视觉关键词（5-8 个，逗号分隔）
  visualTags?: string[];
}

export interface Inspiration {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  coverImage?: string;
  description?: string;
  // 形式小类（多选）
  subCategories?: string[];
  subCategoryNames?: string[];
  // 展馆类型
  venueType?: string;
  venueTypeName?: string;
  // 状态
  status: InspirationStatus;
  // AI 建议
  aiSuggestion?: AIClassification;
  // 视觉描述（"帮你找"搜索用）
  visualDescription?: string;
  visualTags?: string[];
  // 预计算的 embedding 向量（1024 维），加速搜索
  visualEmbedding?: number[];
  // 用户补充
  userNote?: string;
  tags?: string[];
  // 时间
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  source: 'shortcut' | 'manual' | 'import';
}

export interface DataStore {
  inspirations: Record<string, Inspiration>;
  categories: SubCategory[];        // 形式小类
  venueTypes: VenueType[];          // 展馆类型
  settings: {
    lastBackupAt?: string;
    backupEmail?: string;
  };
}

export const DEFAULT_DATA: DataStore = {
  inspirations: {},
  categories: DEFAULT_CATEGORIES,
  venueTypes: DEFAULT_VENUE_TYPES,
  settings: {},
};

// 平台识别
export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes('xiaohongshu.com') || u.includes('xhslink.com')) return 'xiaohongshu';
  if (u.includes('douyin.com') || u.includes('iesdouyin.com')) return 'douyin';
  if (u.includes('huaban.com') || u.includes('hbimg.com')) return 'huaban';
  return 'other';
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  huaban: '花瓣',
  other: '其他',
};

export const STATUS_LABELS: Record<InspirationStatus, string> = {
  pending: '待整理',
  organized: '已整理',
  used: '已用',
};
