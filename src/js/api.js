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
    { id: 'pending', label: '待确认', icon: '✨', href: '/inspirations?status=pending' },
    { id: 'used', label: '已用', icon: '🏆', href: '/inspirations?status=used' },
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
