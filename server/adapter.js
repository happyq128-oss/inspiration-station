// server/adapter.js
// 把 Netlify Functions 风格的 handler 适配到 Express 路由
// Netlify handler 签名: (event, context) => { statusCode, headers, body }
// Express: (req, res) => ...

/**
 * Netlify event 兼容层构造
 *  - event.httpMethod: 'GET' | 'POST' | ...
 *  - event.headers: 小写化
 *  - event.body: JSON 字符串（如果是对象）
 *  - event.queryStringParameters: { ...req.query }
 */
function buildEvent(req) {
  // headers 统一小写（Netlify Functions 在 Lambda 里是小写的）
  const headers = {};
  for (const [k, v] of Object.entries(req.headers || {})) {
    headers[k.toLowerCase()] = v;
  }

  // body：Netlify 期望 string 或 null
  let body = null;
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      body = req.body;
    } else {
      body = JSON.stringify(req.body);
    }
  }

  return {
    httpMethod: req.method,
    path: req.path,
    headers,
    body,
    queryStringParameters: req.query,
    isBase64Encoded: false,
  };
}

/**
 * 把 handler 返回的 Lambda 风格响应写回 Express
 */
function sendResult(res, result) {
  if (!result) {
    return res.status(204).end();
  }
  const status = result.statusCode || 200;
  res.status(status);
  if (result.headers) {
    for (const [k, v] of Object.entries(result.headers)) {
      try {
        res.set(k, String(v));
      } catch (e) {
        // 忽略非法 header（比如 set-cookie 需要数组）
      }
    }
  }
  if (result.body === null || result.body === undefined) {
    return res.end();
  }
  res.send(result.body);
}

/**
 * 主函数：把 Netlify handler 包装成 Express middleware
 */
function netlifyToExpress(handler) {
  return async (req, res, next) => {
    try {
      const event = buildEvent(req);
      const result = await handler(event, {});
      sendResult(res, result);
    } catch (e) {
      console.error('[adapter] handler crashed:', e);
      if (!res.headersSent) {
        res.status(500).json({ error: e.message || 'Internal error' });
      }
      next(e);
    }
  };
}

module.exports = { netlifyToExpress, buildEvent, sendResult };
