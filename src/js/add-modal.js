// src/js/add-modal.js
// 手动添加灵感的弹窗组件（首页 + 灵感库共用）
// 全局函数：openAddModal() / closeAddModal() / submitAdd()
// 依赖：API（来自 api.js）、showToast（来自 api.js）

let _addModalImageBase64 = null;

/** 打开手动添加弹窗 */
function openAddModal() {
  _addModalImageBase64 = null;
  const html = `
    <div class="modal-mask show" id="add-modal-mask">
      <div class="modal" style="max-width: 560px;">
        <div class="modal-header">
          <div class="modal-title">手动添加灵感</div>
          <button class="modal-close" type="button" onclick="closeAddModal()">✕</button>
        </div>
        <div class="modal-body">
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
        <div class="modal-footer">
          <button class="btn btn-ghost" type="button" onclick="closeAddModal()">取消</button>
          <button class="btn btn-primary" type="button" id="add-save-btn" onclick="submitAdd()">保存</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  // 拖拽支持
  const dz = document.getElementById('add-drop-zone');
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

  // 回车提交
  setTimeout(() => {
    const urlInput = document.getElementById('add-url');
    if (urlInput) urlInput.focus();
    document.getElementById('add-url').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitAdd();
    });
    document.getElementById('add-title').addEventListener('keydown', e => {
      if (e.key === 'Enter') submitAdd();
    });
  }, 50);
}

/** 关闭手动添加弹窗 */
function closeAddModal() {
  const mask = document.getElementById('add-modal-mask');
  if (mask) mask.remove();
  _addModalImageBase64 = null;
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
  const titleInput = document.getElementById('add-title');
  if (!urlInput) return; // 弹窗已关闭
  const url = (urlInput.value || '').trim();
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
