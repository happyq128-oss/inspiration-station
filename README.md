# 🌸 灵感站 · Inspiration Station

> 展陈形式灵感收集工作台 — **小红书/抖音「保存图片到灵感站」自动入库** + AI 读图预归类 + 黑色侧栏 + 粉黄青配色

![preview](docs/preview.png)

---

## 🌐 当前部署信息

| 项 | 值 |
|---|---|
| **线上地址** | https://inspiration.hildaspace.top （Let's Encrypt 证书 · 自动续期） |
| 备用地址 | `http://47.117.74.222` （裸 IP） |
| 服务器 | 阿里云 ECS `47.117.74.222`（1核2G · Alibaba Cloud Linux 3） |
| 宝塔面板 | `https://47.117.74.222:8888/e2b39030`（安全入口必需 · 仅 HTTPS） |
| 代码目录 | `/www/wwwroot/inspiration-station/` |
| 数据目录 | `/data/inspiration.db` + `/data/inspiration/images/` |
| 进程管理 | PM2 `inspiration`（Node 22 · 端口 3000 → nginx 反代到 80/443） |
| iPhone 快捷方式 | `https://inspiration.hildaspace.top/api/add` |

> ⚠️ **域名访问被 403（Server: Beaver）= ICP 备案未完成**。本项目域名已于 2026-11 通过阿里云 ICP 备案。
> 宝塔面板的 HTTP 会直接 RST、必须走 HTTPS 且带安全入口路径 —— 这是宝塔新版默认机制，不是故障。

---

## 🎯 这是什么？

为展陈（展览陈列）策展人设计的**个人灵感索引工具**。

**核心痛点**：在各大 App 看到好的展陈形式（多媒体、装置、新材料、版面），点完收藏就忘，下次想用找不着。

**解决思路**（**改用相簿自动化**，比分享面板靠谱）：
- 📱 小红书/抖音/任何 App 看到喜欢的 → **分享 → 保存图片 → 选「灵感站」相簿** → 没了
- 🤖 iOS 自动化自动触发，**Qwen-VL 读图自动识别**属于哪个小类 + 适用场馆类型（带置信度）
- 👀 闲时在工作台浏览、补充标签、确认归类
- 📊 看到数字一天天增长，攒得越多越有成就感
- 📋 一键导出 Excel，封面图嵌入

---

## ✨ 核心特性

| 特性 | 说明 |
|---|---|
| 📱 **iPhone 相簿自动化** | 小红书/抖音/任何 App → 分享 → 保存图片到「灵感站」相簿 → 自动入库（**不依赖被封的 URL**） |
| 🤖 **AI 读图预归类** | Qwen-VL 多模态直接看图，自动判断形式（6类）+ 适用场馆类型（3类），带置信度 |
| 🎓 **AI 越用越准** | 你纠正分类 → 自动学习规则 → 下次自动分对（不浪费 token） |
| 📊 **数据概览首页** | 总数、近 7 天趋势、分类分布，一目了然 |
| 🎨 **配色** | 黑侧栏 + 粉(#FF6B9D)/黄(#FFD93D)/青(#4ECDC4) 三色 |
| 📋 **Excel 导出** | 单 Sheet，封面图嵌入，UTF-8 编码文件名 |
| 🔄 **灵感去重** | 同一链接多次分享自动合并 |
| 💾 **自动备份** | 每周日 3 点定时备份 + 手动下载 JSON |
| 🎨 **小类颜色标签** | 每个小类独立颜色，一眼分清 |
| 🌓 **响应式** | 电脑、平板、手机都能用 |

---

## 🚀 5 分钟启动

> ⚠️ 本项目已于 2026-10 从 Netlify 迁移到 **阿里云 ECS**（Express + SQLite + 本地磁盘存图）。
> 下方为**历史部署方式**，仅作参考；实际运维以本文档顶部「当前部署信息」和 `deploy.sh` 为准。

### 1. 准备账号
- GitHub 账号
- Netlify 账号（用 GitHub 登录）
- DeepSeek 账号 + API Key

### 2. 部署到 Netlify（历史方案）

```bash
# 1. 把代码 push 到你的 GitHub 仓库
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/inspiration-station.git
git push -u origin main

# 2. 在 Netlify 后台连接这个仓库
#    Build command: 留空
#    Publish directory: src
#    Functions directory: netlify/functions（自动识别）

# 3. 设置环境变量
#    API_TOKEN = 你随便生成的字符串
#    DEEPSEEK_API_KEY = 你的 DeepSeek 真实 key

# 4. 等待部署完成
```

### 3. 在 iPhone 配置相簿自动化

详见 [docs/IOS_SHORTCUT.md](./docs/IOS_SHORTCUT.md) — **10 分钟配一次，以后再也不用配**。

### 4. 开始使用

打开小红书/抖音 → 看到喜欢的 → **分享 → 保存图片 → 选「灵感站」相簿** → 自动化跑完通知「✨ 灵感已保存」 → 闲时打开工作台浏览、修正、导出。

---

## 📂 项目结构

```
inspiration-station/
├── server/                          # 【ECS】Express 入口
│   ├── index.js                     #   路由注册 + .env 自动加载
│   └── adapter.js                   #   Netlify handler → Express 中间件适配器
├── scripts/
│   ├── build-functions.js           #   esbuild 打包 netlify/functions → dist/
│   ├── migrate-from-netlify.cjs     #   Netlify Blobs → SQLite 数据迁移
│   ├── fix-local-paths.cjs          #   修复本地图片路径字符不匹配
│   └── diag-local-paths.cjs         #   路径问题诊断
├── netlify.toml                    # Netlify 配置（历史）
├── package.json                    # 依赖
├── tsconfig.json                   # TypeScript 配置
├── netlify/
│   └── functions/                  # 后端 API（Lambda 风格，由 adapter 包装）
│       ├── lib/
│       │   ├── types.ts            #   数据模型
│       │   ├── storage.ts          #   数据层路由（按 DATA_BACKEND 分流）
│       │   ├── storage-sqlite.ts   #   ECS：SQLite + 本地磁盘（当前生产）
│       │   ├── storage-blobs.ts    #   Netlify Blobs（历史）
│       │   ├── scraper.ts          #   页面抓取
│       │   ├── ai.ts               #   千问 Qwen 集成
│       │   ├── embedding.ts        #   向量检索（AI 找图）
│       │   └── utils.ts            #   工具函数
│       ├── add-inspiration.ts      #   快捷指令调用入口
│       ├── list-inspirations.ts
│       ├── update-inspiration.ts
│       ├── delete-inspiration.ts
│       ├── ai-classify.ts          #   手动重分类
│       ├── batch-classify.ts       #   批量分类
│       ├── batch-confirm.ts        #   批量确认（4 条/页）
│       ├── scrape-page.ts          #   手动重抓取
│       ├── get-stats.ts
│       ├── manage-categories.ts
│       ├── export-excel.ts
│       ├── backup-data.ts
│       ├── feedback.ts             #   用户纠正（AI 自学习）
│       └── reset-bad-status.ts     #   重置异常分类
├── src/                            # 网页端（静态）
│   ├── index.html                  # 首页（数据概览）
│   ├── pages/
│   │   ├── inspirations.html       # 灵感列表
│   │   ├── confirm.html            # AI 确认页
│   │   └── settings.html           # 设置页
│   ├── css/
│   │   └── main.css                # 主样式（黑粉黄青配色）
│   └── js/
│       └── api.js                  # API 客户端
└── docs/
    ├── DEPLOY.md                   # 部署教程
    ├── IOS_SHORTCUT.md             # iOS 快捷指令教程
    └── DEEPSEEK_API.md             # API Key 教程
```

---

## 🎨 设计风格

参考的是**现代简约 + 略带可爱**：

- **侧栏**：纯黑底 + 白字 + 粉色高亮当前页
- **主背景**：极浅灰 (#FAFAFA)
- **强调色**：
  - 🩷 粉色 `#FF6B9D` — 状态、操作、未读
  - 💛 黄色 `#FFD93D` — Logo、已用标记、+1 成就感
  - 🩵 青绿 `#4ECDC4` — 已整理、链接按钮
  - 💜 紫色 `#A78BFA` — 版面类（4 个小类各一色）

- **版式**：大留白 + 大圆角 + 字重对比 + 卡片化

---

## 🤖 AI 分类逻辑

每条灵感会得到这样的 AI 评估：

```json
{
  "subCategory": "installation",
  "subCategoryName": "装置",
  "confidence": 85,
  "reasoning": "图中展示的是大型悬挂式空间装置，符合装置类定义"
}
```

**4 个小类**：
- `multimedia` 多媒体 — 声光电、投影、互动、AR/VR、影像装置
- `installation` 装置 — 空间装置、雕塑、景观、机械装置
- `material` 新材料 — 新型材料、工艺、特殊表面
- `layout` 版面 — 平面设计、排版、视觉系统

**置信度**：
- ≥ 70% 青色（高信任）
- 40-69% 橙色（中等）
- < 40% 红色（建议人工确认）

---

## 💰 成本估算

| 项目 | 成本 |
|---|---|
| 阿里云 ECS（1核2G / 3Mbps） | ~8 元/月（99 元/年促销价） |
| 阿里云 OSS（图片存储，可选） | 按量，几分钱 |
| 域名 hildaspace.top | 9 元/年 |
| 千问 API（qwen3.8-omni-flash） | ~0.001 元/条 |
| **月总成本** | **约 10 元** |

---

## 🔐 隐私

- 所有数据存在你自己的阿里云 ECS（SQLite + 本地磁盘，账号在你名下）
- AI 只把标题+描述发给千问，不发 URL 也不发截图（图片仅本地分析）
- 不收集任何用户数据
- 随时可以删除整个项目，删了 ECS 实例和 `/data/` 就没了

---

## 📜 License

MIT — 你可以自由使用、修改、分发。

---

## 🙏 致谢

- 配色灵感来自 [CC的艺术手帐](https://xiaohongshu.com) 的工作台设计
- AI 能力来自 [千问 Qwen](https://qianwenai.com)
- 部署平台 [阿里云 ECS](https://ecs.console.aliyun.com) + 宝塔面板

---

## 🎉 现在就开始

👉 [iOS 快捷指令配置](./docs/IOS_SHORTCUT.md)
👉 [部署教程](./docs/DEPLOY.md)
👉 [API Key 申请](./docs/DEEPSEEK_API.md)
