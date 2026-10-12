// netlify/functions/lib/storage.ts
// 数据层入口
// 根据环境变量 DATA_BACKEND 选择后端：
//   - 'sqlite' (默认): 走 SQLite + 阿里云 OSS（推荐用于自建服务器）
//   - 'blobs': 走 Netlify Blobs（Netlify 部署用，不要动）
//
// 所有 22 个 endpoint 都不需要改——它们都从这个文件 import 同样的 API。

const backend = process.env.DATA_BACKEND === 'blobs'
  ? require('./storage-blobs')
  : require('./storage-sqlite');

export const {
  loadData,
  saveData,
  addInspiration,
  updateInspiration,
  deleteInspiration,
  findByUrl,
  listInspirations,
  saveImage,
  getImage,
  getImageStore,
  setNetlifyContext,
} = backend;
