# DeepSeek API 申请教程

5 分钟搞定，1 块钱能用很久。

---

## 1. 注册账号

1. 打开 [platform.deepseek.com](https://platform.deepseek.com)
2. 点右上角「注册」
3. 用手机号注册（支持中国大陆手机号）
4. 完成实名认证（个人用户，1 分钟搞定）

## 2. 充值

1. 登录后，点右上角「余额」→「充值」
2. 最低充值金额：**1 元**
3. 选择支付方式（微信/支付宝）

⚠️ 1 块钱够处理几十万条灵感，正常用几年没问题。

## 3. 创建 API Key

1. 左侧菜单点「API Keys」
2. 点「Create new secret key」
3. 给 key 起个名字：`灵感站`
4. 复制生成的 key（**只显示一次，关掉就找不到了**）
5. 妥善保存

格式类似：`sk-开头的一串字符（请替换为你的真实 key）`

## 4. 测试 Key 是否可用

打开终端（Mac）或者 PowerShell（Windows），跑：

```bash
curl https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-你的key" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'
```

如果返回：
```json
{"choices": [{"message": {"content": "你好！有什么可以帮你..."}}]}
```

恭喜，API key 可用！

## 5. 填到 Netlify 环境变量

1. 登录 [app.netlify.com](https://app.netlify.com)
2. 选你的灵感站项目
3. `Site configuration` → `Environment variables`
4. 点 `Add a variable`
5. **Key**: `DEEPSEEK_API_KEY`
6. **Value**: 粘贴你的 key
7. 保存
8. `Deploys` → `Trigger deploy` → `Deploy site` 触发重新部署

## 6. 验证 AI 集成

在灵感站网页端，添加一条带图片的灵感：

1. 找一个小红书/抖音链接
2. 手动添加或用快捷指令
3. 等 10-30 秒
4. 打开这条灵感
5. 应该看到粉色框「🤖 AI 预归类」+ 一个小类 + 置信度

## 7. 价格

DeepSeek-chat 模型：
- 输入：1 元 / 百万 tokens
- 输出：2 元 / 百万 tokens

**典型一条灵感的成本**：
- 输入：~500 tokens（标题+描述）
- 输出：~50 tokens（分类结果）
- 成本：**约 0.0006 元/条**

**你日常使用**：
- 每天 10 条灵感 × 30 天 = 300 条/月
- 月成本：**约 0.18 元**
- 充值 1 块钱够用 **5 年以上**

## 8. 常见问题

### Q: API 调用失败 "Authentication Fails"
A: 检查 key 是否正确复制（可能多了空格），或者 key 被删了，重新创建。

### Q: 提示 "Insufficient Balance"
A: 余额不足，去充值。

### Q: AI 分类不准
A: 当前的 prompt 是基于"展陈形式"优化的，如果你抓的是非展陈类内容（比如美食、穿搭），AI 会硬归到 4 类里。
解决方案：在确认页改小类，AI 会"学习"（未来会加入反馈学习机制）。

### Q: 想要更准的分类
A: 把"标题 + 描述 + 封面图 URL"喂给多模态模型（比如 GPT-4o）。但成本会高 30 倍。

### Q: 想换其他模型
A: 修改 `netlify/functions/lib/ai.ts`：
- 把 `DEEPSEEK_API` 改成其他 URL
- 把 `deepseek-chat` 改成其他模型名
- 调整 prompt

---

🎉 搞定！你的灵感站现在有了 AI 能力。
