// netlify/functions/export-excel.ts
// 导出 Excel（封面图嵌入）

import { Handler } from '@netlify/functions';
import ExcelJS from 'exceljs';
import { loadData } from './lib/storage';
import { PLATFORM_LABELS, STATUS_LABELS } from './lib/types';
import { requireAuth } from './lib/utils';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return {
    statusCode: 200,
    headers: corsHeaders(),
    body: '',
  };
  if (!(await requireAuth(event))) return {
    statusCode: 401,
    headers: corsHeaders(),
    body: JSON.stringify({ error: 'Unauthorized' }),
  };

  const data = await loadData();
  const list = Object.values(data.inspirations).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  // 过滤参数
  const params = event.queryStringParameters || {};
  const filterStatus = params.status;
  const filterCategory = params.subCategory;
  const filtered = list.filter(i => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterCategory && i.subCategory !== filterCategory) return false;
    return true;
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inspiration Station';
  workbook.created = new Date();

  // 单 Sheet：所有灵感（按需求）
  const sheet = workbook.addWorksheet('形式灵感', {
    properties: { defaultRowHeight: 100 },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: '封面', key: 'cover', width: 18 },
    { header: '标题', key: 'title', width: 40 },
    { header: '小类', key: 'subCategory', width: 12 },
    { header: '状态', key: 'status', width: 12 },
    { header: '平台', key: 'platform', width: 12 },
    { header: '抓取时间', key: 'createdAt', width: 22 },
    { header: '确认时间', key: 'confirmedAt', width: 22 },
    { header: 'AI 置信度', key: 'confidence', width: 12 },
    { header: '原始链接', key: 'url', width: 50 },
    { header: '描述', key: 'description', width: 50 },
    { header: '备注', key: 'userNote', width: 30 },
  ];

  // 标题行样式
  sheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF111111' },
  };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 28;

  // 写入每条数据
  for (let i = 0; i < filtered.length; i++) {
    const insp = filtered[i];
    const row = sheet.addRow({
      cover: '',
      title: insp.title || '无标题',
      subCategory: insp.subCategoryName || (insp.aiSuggestion?.subCategoryName) || '未分类',
      status: STATUS_LABELS[insp.status] || insp.status,
      platform: PLATFORM_LABELS[insp.platform] || insp.platform,
      createdAt: formatDate(insp.createdAt),
      confirmedAt: insp.confirmedAt ? formatDate(insp.confirmedAt) : '',
      confidence: insp.aiSuggestion ? `${insp.aiSuggestion.confidence}%` : '',
      url: { text: insp.url, hyperlink: insp.url },
      description: insp.description || '',
      userNote: insp.userNote || '',
    });

    row.height = 100;
    row.alignment = { vertical: 'middle', wrapText: true };
    row.getCell('url').font = { color: { argb: 'FF0066CC' }, underline: true };

    // 小类颜色：根据小类库配色
    const cat = data.categories.find(c => c.id === insp.subCategory);
    if (cat) {
      const cell = row.getCell('subCategory');
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: hexToArgb(cat.color, '33') }, // 半透明
      };
      cell.font = { bold: true, color: { argb: hexToArgb(cat.color, 'FF') } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // 状态颜色
    const statusCell = row.getCell('status');
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (insp.status === 'used') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD93D' } };
    } else if (insp.status === 'organized') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4ECDC4' } };
    } else {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5EC' } };
    }

    // 嵌入封面图
    if (insp.coverImage) {
      try {
        const imgBuffer = await fetchImage(insp.coverImage);
        if (imgBuffer) {
          const imageId = workbook.addImage({
            buffer: imgBuffer,
            extension: 'jpeg',
          });
          sheet.addImage(imageId, {
            tl: { col: 0, row: i + 1 },
            ext: { width: 120, height: 90 },
            editAs: 'oneCell',
          });
        }
      } catch (e) {
        // 加载失败：填文字
        row.getCell('cover').value = '图片加载失败';
        row.getCell('cover').font = { italic: true, color: { argb: 'FF999999' } };
        row.getCell('cover').alignment = { horizontal: 'center', vertical: 'middle' };
      }
    } else {
      row.getCell('cover').value = '无封面';
      row.getCell('cover').font = { italic: true, color: { argb: 'FF999999' } };
      row.getCell('cover').alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  // 底部统计行
  sheet.addRow([]);
  const summaryRow = sheet.addRow(['', `共 ${filtered.length} 条灵感`, '', '', '', '', '', '', '', '', '']);
  summaryRow.font = { bold: true, italic: true, color: { argb: 'FF999999' } };

  const buffer = await workbook.xlsx.writeBuffer();
  // Netlify Functions 的 body 必须是 string，二进制要转 base64
  const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64');

  // HTTP header 必须是 ASCII，所以 filename 用英文
  // 同时用 RFC 5987 编码中文名给现代浏览器
  const dateStr = new Date().toISOString().slice(0, 10);
  const filenameAscii = `inspirations_${dateStr}.xlsx`;
  const filenameUtf8 = encodeURIComponent(`形式灵感库_${dateStr}.xlsx`);

  return {
    statusCode: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filenameAscii}"; filename*=UTF-8''${filenameUtf8}`,
    },
    body: base64,
    isBase64Encoded: true,
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', { hour12: false });
}

function hexToArgb(hex: string, alpha: string): string {
  // '#FF6B9D' -> 'FFFF6B9D' (alpha='FF')
  const h = hex.replace('#', '').toUpperCase();
  return alpha + h;
}

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export { handler };
