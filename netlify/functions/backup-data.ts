// netlify/functions/backup-data.ts
// 数据备份：导出完整数据 JSON

import { Handler } from '@netlify/functions';
import { loadData, saveData } from './lib/storage';
import { jsonResponse, errorResponse, requireAuth } from './lib/utils';

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });
  if (!(await requireAuth(event))) return errorResponse('Unauthorized', 401);

  const data = await loadData();

  if (event.httpMethod === 'GET') {
    // 导出 JSON 备份
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
    const filename = `inspiration-backup-${new Date().toISOString().slice(0, 10)}.json`;
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(backup, null, 2),
    };
  }

  if (event.httpMethod === 'POST') {
    // 触发备份（更新 lastBackupAt）
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    data.settings.lastBackupAt = new Date().toISOString();
    if (email) data.settings.backupEmail = email;
    await saveData(data);

    return jsonResponse({
      success: true,
      message: '备份时间已记录',
      lastBackupAt: data.settings.lastBackupAt,
    });
  }

  return errorResponse('Method not allowed', 405);
};

export { handler };
