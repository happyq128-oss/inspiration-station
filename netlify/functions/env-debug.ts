import { Handler } from '@netlify/functions';
import { withContext } from './lib/handler';
import { setNetlifyContext } from './lib/storage';

const _inner: Handler = async (event, _ctx) => {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      hasEnvContext: !!process.env.NETLIFY_BLOBS_CONTEXT,
      hasGlobalContext: !!(globalThis as any).netlifyBlobsContext,
      hasEnvToken: !!process.env.NETLIFY_BLOBS_TOKEN,
      hasEnvSiteID: !!process.env.MY_SITE_ID,
      envContextPreview: process.env.NETLIFY_BLOBS_CONTEXT ? process.env.NETLIFY_BLOBS_CONTEXT.slice(0, 100) + '...' : null,
      // 解析看看
      parsed: process.env.NETLIFY_BLOBS_CONTEXT ? (() => {
        try {
          const ctx = JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT, 'base64').toString());
          return { siteID: ctx.siteID, hasToken: !!ctx.token, tokenExp: (() => { try { return JSON.parse(Buffer.from(ctx.token.split('.')[1], 'base64').toString()).exp; } catch { return 'parse error'; } })() };
        } catch (e: any) {
          return { error: e.message };
        }
      })() : null,
    }, null, 2),
  };
};

export const handler: Handler = withContext(async (event, context) => _inner(event, context));
