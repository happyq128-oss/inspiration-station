// API 客户端 + 通用工具

const API_BASE = ''; // 同源调用 Netlify Functions

const API = {
  getToken() {
    return localStorage.getItem('api_token') || '';
  },

  setToken(t) {
    if (t) localStorage.setItem('api_token', t);
    else localStorage.removeItem('api_token');
  },

  async request(path, options = {}, isRetry = false) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['X-Auth-Token'] = token;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (e) {
      throw new Error('网络错误：' + e.message);
    }

    // 401 自动弹 token 输入框
    if (res.status === 401 && !isRetry) {
      const t = prompt('需要 API Token（在 Netlify 环境变量 API_TOKEN 设置的值）：');
      if (t && t.trim()) {
        this.setToken(t.trim());
        return this.request(path, options, true);
      }
      throw new Error('Unauthorized（未输入 Token）');
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      let data;
      try { data = await res.json(); } catch (e) {
        throw new Error('响应解析失败（HTTP ' + res.status + '，可能 API 路径错配）');
      }
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.blob();
  },

  // 灵感
  addInspiration(data) { return this.request('/api/add', { method: 'POST', body: data }); },
  listInspirations(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request('/api/list' + (qs ? '?' + qs : ''));
  },
  updateInspiration(id, patch, learnFromCorrection = false) {
    return this.request('/api/update', { method: 'POST', body: { id, learnFromCorrection, ...patch } });
  },
  deleteInspirations(ids) {
    return this.request('/api/delete', { method: 'POST', body: { ids } });
  },

  // AI / 抓取
  reclassify(id) { return this.request('/api/ai-classify', { method: 'POST', body: { id } }); },
  rescrape(id) { return this.request('/api/scrape', { method: 'POST', body: { id } }); },

  // 批量 AI 整理（用户主动触发）
  batchClassify(opts = {}) {
    const body = opts.ids ? { ids: opts.ids } : { all: true };
    return this.request('/api/batch-classify', { method: 'POST', body });
  },

  // 统计
  getStats() { return this.request('/api/stats'); },

  // 类别
  getCategories() { return this.request('/api/categories'); },
  saveCategories(categories, venueTypes) {
    return this.request('/api/categories', { method: 'POST', body: { categories, venueTypes } });
  },

  // 导出
  exportExcel(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const token = this.getToken();
    let url = '/api/export' + (qs ? '?' + qs : '');
    if (token) url += (qs ? '&' : '?') + '_token=' + encodeURIComponent(token);
    window.open(url, '_blank');
  },

  // 备份
  exportBackup() {
    const token = this.getToken();
    let url = '/api/backup';
    if (token) url += '?_token=' + encodeURIComponent(token);
    window.open(url, '_blank');
  },
  markBackedUp() {
    return this.request('/api/backup', { method: 'POST', body: {} });
  },

  // 数据修复：把 AI 误标的"已整理"重置回"待整理"
  resetBadStatus(dryRun = false) {
    return this.request('/api/reset-bad-status', { method: 'POST', body: { dryRun } });
  },

  // 规则清理：清掉分类里累积的"学习规则"（rules 数组）
  // mode: 'all' = 清空所有；'bug' = 只清疑似 bug（占位标题累积的）
  resetRules(mode = 'bug', dryRun = false) {
    return this.request('/api/reset-rules', { method: 'POST', body: { mode, dryRun } });
  },
};

// 全局工具
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < day) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 7 * day) return Math.floor(diff / day) + ' 天前';
  return d.toLocaleDateString('zh-CN');
}

function showToast(msg, duration = 2000) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

function getCategoryColor(categories, id) {
  if (!id) return '#999';
  const c = categories.find(x => x.id === id);
  return c?.color || '#999';
}

function getCategoryName(categories, id) {
  if (!id) return '未分类';
  const c = categories.find(x => x.id === id);
  return c?.name || id;
}

const PLATFORM_LABEL = {
  xiaohongshu: '小红书',
  douyin: '抖音',
  huaban: '花瓣',
  other: '其他',
};

const STATUS_LABEL = {
  pending: '待整理',
  organized: '已整理',
  used: '已用',
};

function renderSidebar(activePage) {
  const items = [
    { id: 'home', label: '首页', icon: '🏠', href: '/' },
    { id: 'list', label: '灵感库', icon: '📚', href: '/inspirations' },
  ];

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">灵</div>
        <div class="brand-name">灵感站<small>Inspiration Station</small></div>
      </div>
      <nav class="nav">
        ${items.map(i => `
          <a href="${i.href}" class="nav-item ${activePage === i.id ? 'active' : ''}">
            <span class="icon">${i.icon}</span>
            <span>${i.label}</span>
          </a>
        `).join('')}
        <a href="/settings" class="nav-item ${activePage === 'settings' ? 'active' : ''}">
          <span class="icon">⚙️</span>
          <span>设置</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <strong>用 iPhone 分享</strong> 时选「保存到灵感站」即可一键收集 ✨
      </div>
    </aside>
  `;
}

/**
 * 点击标题就地编辑（不跳转到详情页）
 * - 单击标题 → 变成输入框
 * - 回车 / 失焦 → 保存
 * - Esc → 取消
 * - 事件不会冒泡到卡片（避免触发跳详情）
 * @param {string} id - 灵感 ID
 * @param {HTMLElement} el - 标题元素
 * @param {Event} e - 点击事件（用于 stopPropagation）
 * @param {Function} onSaved - 保存后的回调（可选，用于更新 state）
 */
async function startEditTitle(id, el, e, onSaved) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  // 已经在编辑了，不再开新编辑
  if (el.getAttribute('contenteditable') === 'true') return;

  const originalHtml = el.innerHTML;
  const currentTitle = (el.dataset.title || el.textContent || '').trim();
  const isEmpty = !currentTitle || currentTitle === '无标题';

  el.setAttribute('contenteditable', 'true');
  el.dataset.title = currentTitle;
  el.textContent = isEmpty ? '' : currentTitle;

  // 全选文字
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  let finished = false;
  const cleanup = () => {
    el.removeAttribute('contenteditable');
  };

  const restoreOriginal = () => {
    cleanup();
    el.innerHTML = originalHtml;
  };

  const save = async () => {
    if (finished) return;
    finished = true;
    cleanup();
    const newTitle = (el.textContent || '').trim();
    // 恢复显示
    el.textContent = newTitle || '无标题';

    if (newTitle === currentTitle || (newTitle === '' && isEmpty)) {
      return; // 没变化
    }

    try {
      const res = await API.updateInspiration(id, { title: newTitle || '无标题' });
      if (res.success) {
        el.dataset.title = newTitle;
        if (typeof onSaved === 'function') {
          onSaved(id, newTitle || '无标题');
        }
        // 静默成功，不弹 toast（太打扰了）
      } else {
        showToast('更新失败：' + (res.error || ''), 3000);
        restoreOriginal();
      }
    } catch (err) {
      showToast('更新失败：' + (err.message || '网络错误'), 3000);
      restoreOriginal();
    }
  };

  const cancel = () => {
    if (finished) return;
    finished = true;
    restoreOriginal();
  };

  el.addEventListener('blur', () => setTimeout(save, 100), { once: true });
  el.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter') {
      ev.preventDefault();
      el.blur(); // 触发 save
    } else if (ev.key === 'Escape') {
      ev.preventDefault();
      cancel();
    }
  });
}
