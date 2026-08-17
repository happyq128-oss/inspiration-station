// src/js/add-modal.js
// "新灵感来啦" 弹窗组件（首页 + 灵感库共用）
// 颠覆性设计：弹窗顶部两个 tab
//   - 🔗 线上灵感（手动填链接 + 可选截图）
//   - 📁 硬盘索引（从 Finder 选图，自动带 localPath + 同步 AI 整理）
// 全局函数：openAddModal(defaultTab) / closeAddModal() / switchAddTab()
// 依赖：API（来自 api.js）、showToast（来自 api.js）

let _addModalImageBase64 = null;
let _currentAddTab = 'url';  // 'url' | 'local'
let _localFilesInProgress = 0;  // 硬盘 tab 选中的文件数
let _bridgeTokenCache = null;  // 缓存 local-bridge token

/** 打开"新灵感来啦"弹窗 */
function openAddModal(defaultTab = 'url') {
  _addModalImageBase64 = null;
  _currentAddTab = defaultTab;
  const html = `
    <div class="modal-mask show" id="add-modal-mask">
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <div class="modal-title">✨ 新灵感来啦</div>
          <button class="modal-close" type="button" onclick="closeAddModal()">✕</button>
        </div>

        <!-- Tab 切换 -->
        <div style="display: flex; border-bottom: 2px solid var(--color-border); background: #fafafa;">
          <button id="tab-btn-url" class="add-tab-btn" onclick="switchAddTab('url')" style="flex: 1; padding: 14px; border: none; background: transparent; font-size: 15px; font-weight: 600; cursor: pointer; color: var(--color-text-soft); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
            🔗 线上灵感
          </button>
          <button id="tab-btn-local" class="add-tab-btn" onclick="switchAddTab('local')" style="flex: 1; padding: 14px; border: none; background: transparent; font-size: 15px; font-weight: 600; cursor: pointer; color: var(--color-text-soft); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.2s;">
            📁 硬盘索引
          </button>
        </div>

        <div class="modal-body" id="add-tab-url">
          <!-- 线上灵感表单 -->
          <div class="form-group">
            <label class="form-label">链接 URL <span class="text-mute" style="font-weight: normal;">（可选，有截图也可留空）</span></label>
            <input class="form-input" id="add-url" placeholder="https://www.xiaohongshu.com/explore/...">
          </div>
          <div class="form-group">
            <label class="form-label">标题（可选）</label>
            <input class="form-input" id="add-title" placeholder="自动抓取或留空">
          </div>
          <div class="form-group">
            <label class="form-label">
              截图 <span class="text-mute" style="font-weight: normal;">（推荐，AI 看图分类更准）</span>
            </label>
            <div id="add-drop-zone" style="border: 2px dashed var(--color-border); border-radius: var(--radius); padding: 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafafa;" onclick="document.getElementById('add-file').click()">
              <div id="add-preview-wrap">
                <div style="font-size: 32px; margin-bottom: 6px;">📸</div>
                <div class="text-soft" style="font-size: 13px;">点击选择截图，或拖拽图片到这里</div>
                <div class="text-mute" style="font-size: 11px; margin-top: 4px;">支持 PNG / JPG / 截图（最大 5MB）</div>
              </div>
              <input type="file" id="add-file" accept="image/*" style="display: none;" onchange="handleAddImage(event)">
            </div>
          </div>
        </div>

        <div class="modal-body" id="add-tab-local" style="display: none;">
          <!-- 硬盘索引表单（Day 2 接 Finder） -->
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 56px; margin-bottom: 16px;">📁</div>
            <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #222;">从你的 Mac 硬盘索引图片</div>
            <div class="text-soft" style="font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
              弹窗里点下方按钮，会打开 Finder 文件选择器<br>
              选中图片后自动入库 + AI 整理
            </div>
            <button class="btn btn-primary btn-lg" type="button" onclick="pickFromFinder()" id="pick-from-finder-btn" style="background: #10B981; font-size: 16px; padding: 14px 28px;">
              📂 从 Finder 选图
            </button>
            <div id="local-pick-progress" style="display: none; margin-top: 20px; padding: 16px; background: #f0fdf4; border-radius: 8px;">
              <div style="font-size: 14px; color: #047857; font-weight: 600;" id="local-pick-status">处理中...</div>
            </div>
            <div class="text-mute" style="font-size: 11px; margin-top: 16px;">
              💡 需要 local-bridge 服务在线（已通过开机自启配置）
            </div>
          </div>
        </div>

        <div class="modal-footer" id="add-modal-footer">
          <button class="btn btn-ghost" type="button" onclick="closeAddModal()">取消</button>
          <button class="btn btn-primary" type="button" id="add-save-btn" onclick="submitAdd()">保存</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // 默认 tab
  switchAddTab(defaultTab);

  // 拖拽支持（仅线上 tab）
  const dz = document.getElementById('add-drop-zone');
  if (dz) {
    dz.addEventListener('dragover', e => {
      e.preventDefault();
      dz.style.borderColor = 'var(--color-pink)';
      dz.style.background = 'var(--color-pink-soft)';
    });
    dz.addEventListener('dragleave', e => {
      e.preventDefault();
      dz.style.borderColor = 'var(--color-border)';
      dz.style.background = '#fafafa';
    });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.style.borderColor = 'var(--color-border)';
      dz.style.background = '#fafafa';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleAddImageFile(file);
      }
    });
  }

  // 回车提交（仅线上 tab）
  setTimeout(() => {
    const urlInput = document.getElementById('add-url');
    if (urlInput) {
      urlInput.focus();
      urlInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAdd();
      });
    }
    const titleInput = document.getElementById('add-title');
    if (titleInput) {
      titleInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') submitAdd();
      });
    }
  }, 50);
}

/** 切换 tab */
function switchAddTab(tabName) {
  _currentAddTab = tabName;
  const urlTab = document.getElementById('add-tab-url');
  const localTab = document.getElementById('add-tab-local');
  const urlBtn = document.getElementById('tab-btn-url');
  const localBtn = document.getElementById('tab-btn-local');
  const footer = document.getElementById('add-modal-footer');

  if (tabName === 'url') {
    urlTab.style.display = '';
    localTab.style.display = 'none';
    urlBtn.style.color = 'var(--color-pink)';
    urlBtn.style.borderBottomColor = 'var(--color-pink)';
    localBtn.style.color = 'var(--color-text-soft)';
    localBtn.style.borderBottomColor = 'transparent';
    footer.style.display = '';  // 线上 tab 有保存按钮
  } else {
    urlTab.style.display = 'none';
    localTab.style.display = '';
    localBtn.style.color = '#10B981';
    localBtn.style.borderBottomColor = '#10B981';
    urlBtn.style.color = 'var(--color-text-soft)';
    urlBtn.style.borderBottomColor = 'transparent';
    footer.style.display = 'none';  // 硬盘 tab 自己有"从 Finder 选"按钮
  }
}

/** 关闭"新灵感来啦"弹窗 */
function closeAddModal() {
  const mask = document.getElementById('add-modal-mask');
  if (mask) mask.remove();
  _addModalImageBase64 = null;
  _localFilesInProgress = 0;
}

/** 从 Finder 选图（硬盘 tab）—— Day 2 接 local-bridge 端点 */
async function pickFromFinder() {
  const btn = document.getElementById('pick-from-finder-btn');
  const progress = document.getElementById('local-pick-progress');
  const status = document.getElementById('local-pick-status');

  if (btn.disabled) return;
  btn.disabled = true;
  btn.textContent = '⏳ 弹窗中...';

  try {
    // 1) 拿 token
    const token = await getBridgeToken();
    if (!token) {
      throw new Error('无法从 local-bridge 拿到 token（服务可能离线）');
    }

    // 2) 调本地服务弹 Finder 文件选择器
    const res = await fetch('http://localhost:8765/pick-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Bridge-Token': token },
      body: JSON.stringify({ type: 'image', multiple: true, token }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `本地服务返回 ${res.status}`);
    }
    const data = await res.json();
    if (!data.files || data.files.length === 0) {
      // 用户取消了
      btn.disabled = false;
      btn.textContent = '📂 从 Finder 选图';
      return;
    }

    // 拿到了文件路径列表，逐个入库
    progress.style.display = '';
    _localFilesInProgress = data.files.length;
    status.textContent = `已选 ${data.files.length} 张图，正在入库 + AI 整理...`;

    const localInspIds = [];
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      status.textContent = `处理中 (${i + 1}/${data.files.length})：${file.name}`;

      try {
        // 3) 调本地服务读图 base64
        const readRes = await fetch('http://localhost:8765/read-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Bridge-Token': token },
          body: JSON.stringify({ path: file.path, token }),
        });
        if (!readRes.ok) {
          console.warn(`read-file failed: ${file.path}`);
          continue;
        }
        const readData = await readRes.json();
        if (!readData.base64) continue;

        // 4) 上传到 Netlify 入库
        const uploadRes = await fetch('/api/index-local-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Auth-Token': API.getToken() },
          body: JSON.stringify({
            localPath: file.path,
            parentDir: file.parentDir,
            grandparentDir: file.grandparentDir,
            imageBase64: readData.base64,
            title: file.parentDir,  // 默认标题（用户可在 confirm 改）
          }),
        });
        if (!uploadRes.ok) {
          console.warn(`index-local-image failed: ${file.path}`);
          continue;
        }
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.inspiration) {
          localInspIds.push(uploadData.inspiration.id);
        }
      } catch (e) {
        console.error(`Error processing ${file.path}:`, e);
      }
    }

    // 处理完：关弹窗，刷新列表，跳到 confirm 页调整第一条
    closeAddModal();
    if (typeof window.onInspirationAdded === 'function') {
      try { window.onInspirationAdded(); } catch (e) { console.warn(e); }
    }
    if (localInspIds.length > 0) {
      showToast(`✓ 已索引 ${localInspIds.length} 张图，跳到 confirm 页调整...`, 2000);
      setTimeout(() => {
        location.href = '/confirm?id=' + localInspIds[0];
      }, 500);
    } else {
      showToast('⚠ 没有成功索引的图（可能本地服务离线或路径问题）', 4000);
    }
  } catch (e) {
    progress.style.display = 'none';
    btn.disabled = false;
    btn.textContent = '📂 从 Finder 选图';
    showToast('❌ ' + (e.message || '本地服务不可用'), 5000);
    if (e.message && (e.message.includes('fetch') || e.message.includes('Failed'))) {
      showToast('💡 local-bridge 服务离线？试试双击 local-bridge/status.command 检查', 6000);
    }
  }
}

/** 拿 local-bridge token（缓存避免重复请求） */
async function getBridgeToken() {
  if (_bridgeTokenCache) return _bridgeTokenCache;
  try {
    const res = await fetch('http://localhost:8765/token');
    if (!res.ok) return null;
    const data = await res.json();
    _bridgeTokenCache = data.token;
    return _bridgeTokenCache;
  } catch {
    return null;
  }
}

/** 监听 input[type=file] change 事件 */
function handleAddImage(event) {
  const file = event.target.files[0];
  if (file) handleAddImageFile(file);
}

/** 处理用户选的图片：校验大小 → 读成 base64 → 预览 */
function handleAddImageFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片太大（超过 5MB），请压缩后再试');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    _addModalImageBase64 = e.target.result.split(',')[1]; // 去掉 data:image/...;base64, 前缀
    const wrap = document.getElementById('add-preview-wrap');
    wrap.innerHTML = `
      <img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 8px;">
      <div class="text-soft" style="font-size: 12px;">✓ 截图已就绪，点保存上传</div>
    `;
  };
  reader.readAsDataURL(file);
}

/** 提交保存：调用 API.addInspiration → 关闭弹窗 → 刷新列表（如有 onSaved 回调） */
async function submitAdd() {
  const saveBtn = document.getElementById('add-save-btn');
  const urlInput = document.getElementById('add-url');
  const localPathInput = document.getElementById('add-local-path');
  const titleInput = document.getElementById('add-title');
  if (!urlInput) return; // 弹窗已关闭
  const url = (urlInput.value || '').trim();
  const localPath = (localPathInput?.value || '').trim();
  const title = (titleInput?.value || '').trim();

  // URL 可选——但有图没 URL 也能保存（来源标"未指定"）
  // 没 URL 也没截图 → 拒绝
  if (!url && !_addModalImageBase64) {
    showToast('至少填一个链接或上传一张截图');
    return;
  }
  // 有 URL 但格式不对 → 提示（也允许用户强行保存，按"未指定"处理）
  if (url) {
    try {
      new URL(url);
    } catch {
      showToast('链接格式不对，请检查或留空');
      urlInput.focus();
      return;
    }
  }

  if (saveBtn.disabled) return;
  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  saveBtn.textContent = _addModalImageBase64 ? '上传截图中...' : '保存中...';

  try {
    const body = { title, source: 'manual' };
    if (url) body.url = url;
    if (localPath) body.localPath = localPath;
    if (_addModalImageBase64) body.imageBase64 = _addModalImageBase64;

    const res = await API.addInspiration(body);
    if (res.success) {
      const msg = res.dedup
        ? '该链接已存在（已返回原记录）'
        : (_addModalImageBase64
          ? '✓ 截图已存，待 AI 整理'
          : '✓ 已保存，待 AI 整理');
      showToast(msg, 2500);
      closeAddModal();
      // 如果页面提供了 onInspirationAdded 回调，就调用（比如刷新列表 / 跳到详情）
      if (typeof window.onInspirationAdded === 'function') {
        try { window.onInspirationAdded(res.inspiration || res); } catch (e) { console.warn(e); }
      }
    } else {
      showToast('保存失败：' + (res.error || '未知错误'), 4000);
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  } catch (e) {
    showToast('保存失败：' + (e.message || '网络错误'), 4000);
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}
