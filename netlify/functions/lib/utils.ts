// netlify/functions/lib/utils.ts
// 通用工具

export function generateId(): string {
  return 'insp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function jsonResponse(data: any, status = 200) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(data),
  };
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export async function requireAuth(event: any): Promise<boolean> {
  // 简易 token 鉴权：从环境变量读 API_TOKEN，请求头带 X-Auth-Token
  const token = process.env.API_TOKEN;
  if (!token) return true; // 未设置 token 则放行（开发模式）
  const header = event.headers['x-auth-token'] || event.headers['X-Auth-Token'];
  return header === token;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
