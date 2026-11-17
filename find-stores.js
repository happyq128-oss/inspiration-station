// 列出 Netlify 站点里所有有数据的 store
const { getStore } = require('@netlify/blobs');
const { execSync } = require('child_process');

const status = JSON.parse(execSync('netlify status --json').toString());
const siteID = status.siteData['site-id'];

// Netlify CLI 会从 ~/Library/... 自动拿 token
// 但我们的脚本不在 Netlify runtime 里，需要显式传 token
// 从 netlify CLI 的 config 里读
const token = require('child_process').execSync('netlify api:list --json 2>/dev/null || echo ""').toString().trim();

(async () => {
  console.log(`site: ${status.siteData['site-name']} (${siteID})\n`);

  const candidates = [
    'data', 'store', 'inspirations', 'data-v1', 'data-v2',
    'inspiration-data', 'inspiration-store', 'inspiration-images',
    'images', 'image', 'blobs', 'main', 'kv', 'storage', 'app-data', 'photos',
  ];

  for (const name of candidates) {
    try {
      const store = getStore({ name, siteID, token });
      const { blobs } = await store.list();
      if (blobs.length > 0) {
        console.log(`🎯 ${name}: ${blobs.length} keys`);
        for (const b of blobs.slice(0, 8)) {
          console.log(`   - ${b.key} (${b.size || '?'} bytes)`);
        }
        if (blobs.length > 8) console.log(`   ... and ${blobs.length - 8} more`);
      } else {
        process.stdout.write(`   ${name}: empty\n`);
      }
    } catch (e) {
      process.stdout.write(`   ${name}: ${e.message.slice(0, 60)}\n`);
    }
  }
})();
