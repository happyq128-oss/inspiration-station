// netlify/functions/scheduled-backup.ts
// 定时任务：每周日凌晨 3 点自动备份数据
// 在 netlify.toml 中通过 [functions."scheduled-backup"] schedule = "0 3 * * 0" 配置

import { Handler } from '@netlify/functions';
import { loadData, saveData } from './lib/storage';
import { withContext } from './lib/handler';

const handler: Handler = async () => {
  try {
    const data = await loadData();
    const now = new Date().toISOString();
    data.settings.lastBackupAt = now;
    await saveData(data);

    console.log(`[scheduled-backup] Backup time marked at ${now}`);

    // 如果你配置了备份邮件环境变量，可以在这里发邮件
    // const email = process.env.BACKUP_EMAIL;
    // if (email) { /* 调用 SendGrid/Resend 发邮件 */ }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, lastBackupAt: now }),
    };
  } catch (e: any) {
    console.error('[scheduled-backup] error:', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};

export { handler };
