// netlify/functions/get-image.ts
// 图片代理 API：/api/image/{id} → 返回主图（640px）
//                /api/image/{id}?thumb=1 → 返回缩略图（240px，给 Excel 用）

import { Handler } from '@netlify/functions';
import { getImage } from './lib/storage';
import { jsonResponse, errorResponse } from './lib/utils';
import { withContext } from './lib/handler';
import { getImageStore } from './lib/storage';

const _innerHandler: Handler = async (event, _ctx) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse({ ok: true });

  const params = event.queryStringParameters || {};
  const id = params.id || (event.path || '').split('/').pop();
  const wantThumb = params.thumb === '1' || params.thumb === 'true';

  if (!id || id === 'image') return errorResponse('Missing image id', 400);

  if (wantThumb) {
    // 缩略图：直接读 {id}.thumb.jpg
    try {
      const store = getImageStore();
      const value = await store.get(`${id}.thumb.jpg`, { type: 'arrayBuffer' });
      if (!value) return errorResponse('Thumbnail not found', 404);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
        body: Buffer.from(value as ArrayBuffer).toString('base64'),
        isBase64Encoded: true,
      };
    } catch (e) {
      return errorResponse('Thumbnail fetch failed', 500);
    }
  }

  // 主图
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
