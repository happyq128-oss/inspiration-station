# Netlify 部署保姆级教程

> 不会写代码也能照着做。每一步都附截图说明。

---

## 0. 准备工作

你需要：
- 一个 GitHub 账号（如果没有，去 [github.com](https://github.com) 注册）
- 一个 Netlify 账号（去 [netlify.com](https://netlify.com)，建议用 GitHub 登录）
- 一个 DeepSeek 账号（去 [platform.deepseek.com](https://platform.deepseek.com) 注册，充值 1 块钱够用很久）

预计耗时：**30 分钟**（含等待审核/部署的时间）

---

## 1. 把代码部署到 GitHub

### 1.1 创建 GitHub 仓库
1. 登录 GitHub
2. 右上角 `+` → `New repository`
3. 填仓库名：`inspiration-station`
4. 选 `Public`（公开仓库，Netlify 免费部署需要）
5. 点 `Create repository`

### 1.2 上传代码
方法 A（推荐）：用 GitHub Desktop
- 下载 [GitHub Desktop](https://desktop.github.com)
- 登录后 `File` → `Add local repository` → 选择本项目文件夹
- 提交代码 → `Publish to GitHub`

方法 B：直接网页上传
- 在新建的仓库页面，点击 `uploading an existing file`
- 把项目所有文件拖进去（注意：先 cd 到项目根目录，全选上传）
- 等待上传完成，点 `Commit changes`

---

## 2. 在 Netlify 部署

### 2.1 连接 GitHub
1. 登录 Netlify（[app.netlify.com](https://app.netlify.com)）
2. 左侧菜单点 `Sites`
3. 点 `Add new site` → `Import an existing project`
4. 选 `GitHub`
5. 授权 Netlify 访问你的 GitHub
6. 找到 `inspiration-station` 仓库，点它

### 2.2 配置部署参数
在 "Site settings" 页：

- **Branch to deploy**: `main`
- **Build command**: 留空（我们用静态文件）
- **Publish directory**: `src`
- **Functions directory**: `netlify/functions`（通常自动识别）

点 `Deploy site`。

### 2.3 等待首次部署
- Netlify 会自动安装依赖、运行构建
- 第一次通常 1-3 分钟
- 部署成功后会显示你的域名，类似：`https://random-name-123.netlify.app`

🎉 你的灵感站已经上线了！

---

## 3. 配置环境变量

### 3.1 添加 API Token
1. 在 Netlify 项目页面，点 `Site configuration` → `Environment variables`
2. 点 `Add a variable` → `Add environment variable`
3. 填：
   - **Key**: `API_TOKEN`
   - **Value**: 一个你随机生成的字符串，比如 `请替换为你的token值`
   - 怎么生成？Mac 终端：`openssl rand -hex 16` 输出就是
   - 复制后**手动替换**为真实的随机字符串
4. 勾选 `Same value for all deploy contexts`
5. 点 `Create variable`

### 3.2 添加 DeepSeek API Key
同样方法：
- **Key**: `DEEPSEEK_API_KEY`
- **Value**: 去 [platform.deepseek.com](https://platform.deepseek.com) → `API Keys` → 创建 → 复制

⚠️ 第一次充值 1 块钱够用半年。

### 3.3 重新部署让环境变量生效
1. 点 `Deploys` 标签
2. 点 `Trigger deploy` → `Deploy site`
3. 等待重新部署完成（1-2 分钟）

---

## 4. 配置自定义域名（可选）

如果你有自己的域名：
1. `Domain settings` → `Add custom domain`
2. 填你的域名，按提示去 DNS 添加 CNAME 记录
3. Netlify 自动帮你配 HTTPS

如果你没有自定义域名，直接用 `xxx.netlify.app` 也挺好。

---

## 5. 测试你的灵感站

### 5.1 访问首页
打开 `https://你的域名.netlify.app/`

应该看到：
- 黑色侧栏 + 粉色品牌色
- 顶部 "还没有灵感" 提示
- 底部"用 iPhone 分享"提示

### 5.2 测试 API
打开浏览器，访问：
```
https://你的域名.netlify.app/api/health
```

应该看到：
```json
{
  "status": "ok",
  "service": "inspiration-station",
  "timestamp": "..."
}
```

如果显示这个，恭喜你，后端跑起来了 🎉

### 5.3 添加第一条灵感（手动测试）
1. 打开网页端 `/inspirations`
2. 点右上角 `+ 手动添加`
3. 填一个真实的小红书链接：`https://www.xiaohongshu.com/explore/xxx`
4. 提交

10-30 秒后：
- 灵感应该出现在列表里
- 标题被自动抓取
- AI 给出了小类建议和置信度

---

## 6. 配置 iOS 快捷指令

详见 [IOS_SHORTCUT.md](./IOS_SHORTCUT.md)

---

## 7. 常见问题

### 7.1 部署失败：找不到 @netlify/blobs
**原因**：package.json 里没装上
**解决**：在项目根目录跑：
```bash
npm install
git add package-lock.json
git commit -m "fix deps"
git push
```
Netlify 会自动重新部署。

### 7.2 API 返回 500：环境变量没设
**原因**：DEEPSEEK_API_KEY 或 API_TOKEN 没设
**解决**：按上面第 3 步补上

### 7.3 小红书抓不到内容（标题是"加载中"）
**原因**：小红书反爬，Playwright 也没绕过
**解决**：当前版本先用 URL 缓存抓取（只取 og:title/og:image），失败就降级用 URL 当标题
**未来方案**：升级到 Playwright 抓全页（Netlify Functions 内存有限制，可能需要切到 Railway/Render）

### 7.4 灵感站打开很慢
**原因**：Netlify Functions 冷启动
**解决**：在 `netlify.toml` 加上：
```toml
[functions]
  [functions."add-inspiration"]
    schedule = "@daily"  # 防止冷启动
```

### 7.5 数据丢了怎么办？
**预防**：
- 每周去「设置」点一次「下载完整备份」
- Netlify Blobs 的免费额度是 1GB，足够存几万条灵感

**恢复**：
- 在「设置」未来会加「导入备份」按钮
- 现在如果丢了，可以去 Netlify Blobs 控制台手动看（但 Blobs 没有 UI，丢失难恢复）

---

## 8. 升级到独立域名

如果你想用自己的域名（比如 `inspiration.yourname.com`）：

1. 在域名注册商（阿里云/腾讯云/Cloudflare）添加 CNAME 记录：
   - 主机记录：`inspiration`
   - 记录类型：`CNAME`
   - 记录值：`你的域名.netlify.app.`

2. Netlify 后台 `Domain settings` → `Add custom domain` → 填 `inspiration.yourname.com`

3. 等待 DNS 生效（几分钟到几小时）

4. Netlify 自动给你配置 HTTPS

---

## 🎉 完成！

你现在拥有了一个完全私人的展陈形式灵感收集工作台：

- 📱 iPhone 一键分享，自动抓取
- 🤖 AI 自动预归类 + 置信度
- 🎨 黑粉黄青配色，符合你的视觉偏好
- 📊 首页数据概览，越攒越有成就感
- 📋 Excel 一键导出，汇报时直接打开
- 💾 数据自动备份 + 手动备份双保险

如果遇到问题，去 `Settings` → 各种配置项都能调。

---

## 📞 进一步支持

- 查看 Netlify 部署日志：`Deploys` → 选某次部署 → `Deploy log`
- 查看 Functions 日志：`Functions` → 选某个函数 → `Logs`
- Netlify 文档：[docs.netlify.com](https://docs.netlify.com)
