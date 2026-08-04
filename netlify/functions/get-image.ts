// netlify/functions/get-image.ts
// 图片代理 API：/api/image/{id} → 返回截图

import { Handler } from '@netlify/functions';
import { getImage } from './lib/storage';
import { jsonResponse, errorResponse } from './lib/utils';
import { withContext } from './lib/handler';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });

  const params = event.queryStringParameters || {};
  const id = params.id || (event.path || '').split('/').pop();

  if (!id || id === 'image') return errorResponse('Missing image id', 400);

  const result = await getImage(id);
  if (!result) return errorResponse('Image not found', 404);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
    body: result.buffer.toString('base64'),
    isBase64Encoded: true,
  };
};

const handler = withContext((event, context) => _innerHandler(event, context));
export { handler };
