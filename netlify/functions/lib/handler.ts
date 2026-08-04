// netlify/functions/lib/handler.ts
// 统一处理 Netlify context 注入（让 Blobs 拿到 runtime 凭证）

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { setNetlifyContext } from './storage';

type AsyncHandler = (
  event: HandlerEvent,
  context: HandlerContext,
) => Promise<any>;

/**
 * 包装 handler：在执行前注入 Netlify context（Blobs 需要用）
 * 用法：export const handler = withContext(async (event, context) => { ... })
 */
export function withContext(fn: AsyncHandler): Handler {
  return async (event, context) => {
    setNetlifyContext(context);
    return fn(event, context);
  };
}
