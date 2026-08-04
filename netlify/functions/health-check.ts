// netlify/functions/health-check.ts
// 健康检查

import { Handler } from '@netlify/functions';
import { jsonResponse } from './lib/utils';
import { withContext } from './lib/handler';

const handler: Handler = async () => {
  return jsonResponse({
    status: 'ok',
    service: 'inspiration-station',
    timestamp: new Date().toISOString(),
  });
};

export { handler };
