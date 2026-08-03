// netlify/functions/lib/scraper.ts
// 页面抓取：抓标题、描述、封面图

interface ScrapedData {
  title: string;
  description: string;
  coverImage: string;
}

const USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const TIMEOUT = 15000; // 15s

export async function scrapePage(url: string): Promise<ScrapedData> {
  const empty: ScrapedData = { title: '', description: '', coverImage: '' };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`Scrape ${url} got status ${res.status}`);
      return empty;
    }

    const html = await res.text();
    return parseHtml(html, url);
  } catch (e) {
    console.warn(`Scrape ${url} error:`, e);
    return empty;
  }
}

function parseHtml(html: string, url: string): ScrapedData {
  const result: ScrapedData = { title: '', description: '', coverImage: '' };

  // 1. og:title
  result.title = extractMeta(html, 'og:title') || extractTitle(html);
  // 2. og:description
  result.description = extractMeta(html, 'og:description') || extractMeta(html, 'description');
  // 3. og:image
  result.coverImage = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');

  // 绝对化 URL
  if (result.coverImage && !result.coverImage.startsWith('http')) {
    try {
      result.coverImage = new URL(result.coverImage, url).toString();
    } catch {
      result.coverImage = '';
    }
  }

  return result;
}

function extractMeta(html: string, name: string): string {
  // 兼容 property="og:title" 和 name="description"
  const re = new RegExp(
    `<meta\\s+[^>]*?(?:property|name)=["']${escapeReg(name)}["'][^>]*?content=["']([^"']*?)["']`,
    'i'
  );
  const m = html.match(re);
  if (m) return decodeHtml(m[1]);

  // 反向顺序：content 在前
  const re2 = new RegExp(
    `<meta\\s+[^>]*?content=["']([^"']*?)["'][^>]*?(?:property|name)=["']${escapeReg(name)}["']`,
    'i'
  );
  const m2 = html.match(re2);
  if (m2) return decodeHtml(m2[1]);

  return '';
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtml(m[1].trim()) : '';
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
