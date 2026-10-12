"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/lib/types.ts
var DEFAULT_CATEGORIES, DEFAULT_VENUE_TYPES, DEFAULT_DATA;
var init_types = __esm({
  "netlify/functions/lib/types.ts"() {
    "use strict";
    DEFAULT_CATEGORIES = [
      {
        id: "multimedia",
        name: "\u591A\u5A92\u4F53",
        color: "#FF6B9D",
        description: "\u58F0\u5149\u7535\u3001\u6295\u5F71\u3001\u4E92\u52A8\u88C5\u7F6E\u3001AR/VR\u3001\u6570\u5B57\u5A92\u4F53\u3001\u5F71\u50CF\u88C5\u7F6E"
      },
      {
        id: "installation",
        name: "\u88C5\u7F6E",
        color: "#FFD93D",
        description: "\u7A7A\u95F4\u88C5\u7F6E\u3001\u96D5\u5851\u3001\u666F\u89C2\u3001\u5927\u578B\u6C89\u6D78\u5F0F\u88C5\u7F6E\u3001\u673A\u68B0\u88C5\u7F6E"
      },
      {
        id: "material",
        name: "\u65B0\u6750\u6599",
        color: "#4ECDC4",
        description: "\u65B0\u578B\u6750\u6599\u8FD0\u7528\u3001\u65B0\u578B\u5DE5\u827A\u3001\u65B0\u578B\u5C55\u9648\u6750\u6599\u3001\u7279\u6B8A\u8868\u9762\u5904\u7406"
      },
      {
        id: "layout",
        name: "\u7248\u9762",
        color: "#A78BFA",
        description: "\u5E73\u9762\u8BBE\u8BA1\u3001\u6392\u7248\u3001\u89C6\u89C9\u7CFB\u7EDF\u3001\u7248\u5F0F\u3001\u5B57\u4F53\u5E94\u7528\u3001\u5C55\u677F"
      },
      {
        id: "space",
        name: "\u7279\u6B8A\u7A7A\u95F4\u5904\u7406",
        color: "#FF9F40",
        description: "\u67F1\u5B50\u7684\u5305\u88F9/\u88C5\u9970\u3001\u8DC3\u5C42\u7A7A\u95F4\u3001\u697C\u68AF\u8BBE\u8BA1\u3001\u8D70\u5ECA\u8FC7\u6E21\u7A7A\u95F4\u3001\u5939\u5C42\u3001\u60AC\u6311"
      },
      {
        id: "display",
        name: "\u5C55\u67DC\u67DC\u5185\u8BBE\u8BA1",
        color: "#EC4899",
        description: "\u5C55\u67DC\u5185\u6587\u7269/\u5C55\u54C1\u7684\u6446\u653E\u65B9\u5F0F\u3001\u706F\u5149\u5E03\u7F6E\u3001\u80CC\u666F\u886C\u677F\u3001\u7ACB\u4F53\u573A\u666F"
      }
    ];
    DEFAULT_VENUE_TYPES = [
      {
        id: "museum",
        name: "\u535A\u7269\u9986",
        color: "#3B82F6",
        description: "\u6587\u5316\u4E3B\u9898\u535A\u7269\u9986\uFF08\u5386\u53F2\u3001\u827A\u672F\u3001\u81EA\u7136\u79D1\u5B66\u3001\u884C\u4E1A\u4E13\u9898\u7B49\uFF09"
      },
      {
        id: "memorial",
        name: "\u7EAA\u5FF5\u9986",
        color: "#EF4444",
        description: "\u7231\u56FD\u4E3B\u4E49\u6559\u80B2\u7EAA\u5FF5\u9986\u3001\u7EA2\u8272\u4E3B\u9898\u3001\u7EAA\u5FF5\u6027\u5C55\u9986"
      },
      {
        id: "corporate",
        name: "\u4F01\u4E1A\u9986",
        color: "#10B981",
        description: "\u4F01\u4E1A\u5BA3\u4F20\u9986\uFF08\u54C1\u724C\u5386\u53F2\u3001\u4EA7\u54C1\u6280\u672F\u3001\u4F01\u4E1A\u6587\u5316\uFF09"
      }
    ];
    DEFAULT_DATA = {
      inspirations: {},
      categories: DEFAULT_CATEGORIES,
      venueTypes: DEFAULT_VENUE_TYPES,
      userFeedbacks: [],
      settings: {}
    };
  }
});

// netlify/functions/lib/storage-blobs.ts
var storage_blobs_exports = {};
__export(storage_blobs_exports, {
  addInspiration: () => addInspiration,
  deleteInspiration: () => deleteInspiration,
  findByUrl: () => findByUrl,
  getImage: () => getImage,
  getImageStore: () => getImageStore,
  listInspirations: () => listInspirations,
  loadData: () => loadData,
  saveData: () => saveData,
  saveImage: () => saveImage,
  setNetlifyContext: () => setNetlifyContext,
  updateInspiration: () => updateInspiration
});
function setNetlifyContext(ctx) {
  _netlifyContext = ctx;
}
function getStoreOptions(name) {
  const envContext = process.env.NETLIFY_BLOBS_CONTEXT;
  if (envContext && envContext !== "undefined" && envContext.length > 100) {
    try {
      const ctx = JSON.parse(
        Buffer.from(envContext, "base64").toString("utf8")
      );
      if (ctx.siteID && ctx.token) {
        return (0, import_blobs.getStore)({
          name,
          siteID: ctx.siteID,
          token: ctx.token,
          edgeURL: ctx.edgeURL,
          uncachedEdgeURL: ctx.uncachedEdgeURL
        });
      }
    } catch {
    }
  }
  if (globalThis.netlifyBlobsContext) {
    return (0, import_blobs.getStore)(name);
  }
  const siteID = process.env.MY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (siteID && token) {
    return (0, import_blobs.getStore)({
      name,
      siteID,
      token
    });
  }
  return (0, import_blobs.getStore)(name);
}
function getDataStore() {
  return getStoreOptions(STORE_NAME);
}
function getImageStore() {
  return getStoreOptions(IMAGE_STORE_NAME);
}
async function saveImage(inspirationId, imageBuffer, contentType) {
  const store = getImageStore();
  const key = `${inspirationId}.jpg`;
  await store.set(key, imageBuffer, {
    metadata: { contentType }
  });
  return key;
}
async function getImage(inspirationId) {
  try {
    const store = getImageStore();
    const key = `${inspirationId}.jpg`;
    const value = await store.get(key, { type: "arrayBuffer" });
    if (!value) return null;
    let contentType = "image/jpeg";
    try {
      const meta = await store.getMetadata(key);
      if (meta?.metadata?.contentType) contentType = meta.metadata.contentType;
    } catch {
    }
    return {
      buffer: Buffer.from(value),
      contentType
    };
  } catch (e) {
    console.error(`[getImage] error:`, e);
    return null;
  }
}
async function loadData() {
  const store = getDataStore();
  try {
    const data = await store.get(KEY, { type: "json" });
    if (!data) {
      await saveData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const existingCatIds = new Set((data.categories || []).map((c) => c.id));
    const mergedCategories = [
      ...data.categories || [],
      ...DEFAULT_DATA.categories.filter((c) => !existingCatIds.has(c.id))
    ];
    const existingVenueIds = new Set((data.venueTypes || []).map((v) => v.id));
    const mergedVenueTypes = [
      ...data.venueTypes || [],
      ...DEFAULT_DATA.venueTypes.filter((v) => !existingVenueIds.has(v.id))
    ];
    return {
      inspirations: data.inspirations || {},
      categories: mergedCategories,
      venueTypes: mergedVenueTypes,
      userFeedbacks: data.userFeedbacks || [],
      settings: data.settings || {}
    };
  } catch (e) {
    console.error("Load data error:", e);
    return DEFAULT_DATA;
  }
}
async function saveData(data) {
  const store = getDataStore();
  await store.setJSON(KEY, data);
}
async function addInspiration(insp) {
  const data = await loadData();
  data.inspirations[insp.id] = insp;
  await saveData(data);
}
async function updateInspiration(id, patch) {
  const data = await loadData();
  const existing = data.inspirations[id];
  if (!existing) return null;
  const updated = { ...existing, ...patch, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  data.inspirations[id] = updated;
  await saveData(data);
  return updated;
}
async function deleteInspiration(id) {
  const data = await loadData();
  if (!data.inspirations[id]) return false;
  delete data.inspirations[id];
  await saveData(data);
  return true;
}
async function findByUrl(url) {
  const data = await loadData();
  return Object.values(data.inspirations).find((i) => i.url === url) || null;
}
async function listInspirations(filter) {
  const data = await loadData();
  let list = Object.values(data.inspirations);
  if (filter?.subCategory) {
    const target = filter.subCategory;
    list = list.filter((i) => {
      if (Array.isArray(i.subCategories) && i.subCategories.length > 0) {
        return i.subCategories.includes(target);
      }
      return i.subCategory === target;
    });
  }
  if (filter?.venueType) list = list.filter((i) => i.venueType === filter.venueType);
  if (filter?.status) list = list.filter((i) => i.status === filter.status);
  if (filter?.platform) list = list.filter((i) => i.platform === filter.platform);
  if (filter?.startDate || filter?.endDate) {
    const start = filter?.startDate || "";
    const end = filter?.endDate || "";
    list = list.filter((i) => {
      const d = (i.createdAt || "").slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }
  if (filter?.keyword) {
    const k = filter.keyword.toLowerCase();
    list = list.filter((i) => {
      if ((i.title || "").toLowerCase().includes(k)) return true;
      if ((i.description || "").toLowerCase().includes(k)) return true;
      if ((i.tags || []).some((t) => t.toLowerCase().includes(k))) return true;
      if ((i.userNote || "").toLowerCase().includes(k)) return true;
      if ((i.visualDescription || "").toLowerCase().includes(k)) return true;
      if ((i.aiSuggestion?.visualDescription || "").toLowerCase().includes(k)) return true;
      const allTags = [
        ...i.visualTags || [],
        ...i.aiSuggestion?.visualTags || []
      ];
      if (allTags.some((t) => t.toLowerCase().includes(k))) return true;
      return false;
    });
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
var import_blobs, STORE_NAME, KEY, IMAGE_STORE_NAME, _netlifyContext;
var init_storage_blobs = __esm({
  "netlify/functions/lib/storage-blobs.ts"() {
    "use strict";
    import_blobs = require("@netlify/blobs");
    init_types();
    STORE_NAME = "inspiration-store";
    KEY = "data-v1";
    IMAGE_STORE_NAME = "inspiration-images";
  }
});

// netlify/functions/lib/storage-sqlite.ts
var storage_sqlite_exports = {};
__export(storage_sqlite_exports, {
  addInspiration: () => addInspiration2,
  deleteInspiration: () => deleteInspiration2,
  findByUrl: () => findByUrl2,
  getImage: () => getImage2,
  getImageStore: () => getImageStore2,
  listInspirations: () => listInspirations2,
  loadData: () => loadData2,
  saveData: () => saveData2,
  saveImage: () => saveImage2,
  setNetlifyContext: () => setNetlifyContext2,
  updateInspiration: () => updateInspiration2
});
function getDB() {
  if (_db) return _db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  _db.exec(`
    CREATE TABLE IF NOT EXISTS inspirations (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      url TEXT,
      title TEXT,
      status TEXT DEFAULT 'pending',
      venueType TEXT,
      platform TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      confirmedAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_insp_status ON inspirations(status);
    CREATE INDEX IF NOT EXISTS idx_insp_venue ON inspirations(venueType);
    CREATE INDEX IF NOT EXISTS idx_insp_created ON inspirations(createdAt);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS venueTypes (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS userFeedbacks (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      createdAt TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON userFeedbacks(createdAt);
  `);
  console.log(`[storage-sqlite] \u2713 DB \u521D\u59CB\u5316: ${DB_PATH}`);
  return _db;
}
async function getOssClient() {
  if (_ossClient !== null) return _ossClient;
  if (IMAGE_BACKEND !== "oss") return null;
  try {
    const OSS = require("ali-oss");
    _ossClient = new OSS({
      region: process.env.OSS_REGION,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
      bucket: process.env.OSS_BUCKET
    });
    console.log(`[storage-sqlite] \u2713 OSS \u5BA2\u6237\u7AEF\u521D\u59CB\u5316 (bucket: ${process.env.OSS_BUCKET})`);
    return _ossClient;
  } catch (e) {
    console.error("[storage-sqlite] \u2717 OSS \u521D\u59CB\u5316\u5931\u8D25:", e.message);
    return null;
  }
}
async function readImageRaw(key) {
  if (IMAGE_BACKEND === "oss") {
    const client = await getOssClient();
    if (!client) return null;
    try {
      const result = await client.get(key);
      return {
        buffer: result.content,
        contentType: result.res?.headers?.["content-type"] || "image/jpeg"
      };
    } catch (e) {
      if (e.code === "NoSuchKey") return null;
      throw e;
    }
  }
  const filePath = path.join(IMAGE_DIR, key);
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  const metaPath = filePath + ".meta";
  let contentType = "image/jpeg";
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      if (meta.contentType) contentType = meta.contentType;
    } catch {
    }
  }
  return { buffer, contentType };
}
async function writeImageRaw(key, buffer, contentType) {
  if (IMAGE_BACKEND === "oss") {
    const client = await getOssClient();
    if (!client) throw new Error("OSS \u5BA2\u6237\u7AEF\u4E0D\u53EF\u7528");
    await client.put(key, buffer, {
      headers: { "Content-Type": contentType }
    });
    return;
  }
  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
  fs.writeFileSync(path.join(IMAGE_DIR, key), buffer);
  fs.writeFileSync(path.join(IMAGE_DIR, key + ".meta"), JSON.stringify({ contentType }));
}
async function deleteImageRaw(key) {
  if (IMAGE_BACKEND === "oss") {
    const client = await getOssClient();
    if (!client) return;
    try {
      await client.delete(key);
    } catch {
    }
    return;
  }
  const filePath = path.join(IMAGE_DIR, key);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const metaPath = filePath + ".meta";
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
}
async function loadData2() {
  const db = getDB();
  const insps = db.prepare("SELECT data FROM inspirations").all();
  const cats = db.prepare("SELECT data FROM categories").all();
  const venues = db.prepare("SELECT data FROM venueTypes").all();
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = ?").get(SETTINGS_KEY);
  const feedbacks = db.prepare("SELECT data FROM userFeedbacks").all();
  const inspirations = {};
  for (const row of insps) {
    try {
      const obj = JSON.parse(row.data);
      inspirations[obj.id] = obj;
    } catch {
    }
  }
  const categories = cats.map((r) => JSON.parse(r.data));
  const venueTypes = venues.map((r) => JSON.parse(r.data));
  const userFeedbacks = feedbacks.map((r) => JSON.parse(r.data));
  const settings = settingsRow ? JSON.parse(settingsRow.value) : {};
  const existingCatIds = new Set(categories.map((c) => c.id));
  const mergedCategories = [
    ...categories,
    ...DEFAULT_DATA.categories.filter((c) => !existingCatIds.has(c.id))
  ];
  const existingVenueIds = new Set(venueTypes.map((v) => v.id));
  const mergedVenueTypes = [
    ...venueTypes,
    ...DEFAULT_DATA.venueTypes.filter((v) => !existingVenueIds.has(v.id))
  ];
  return {
    inspirations,
    categories: mergedCategories,
    venueTypes: mergedVenueTypes,
    userFeedbacks,
    settings
  };
}
async function saveData2(data) {
  const db = getDB();
  const tx = db.exec.bind(db);
  db.exec("DELETE FROM inspirations; DELETE FROM categories; DELETE FROM venueTypes;");
  const insStmt = db.prepare(`
    INSERT INTO inspirations (id, data, url, title, status, venueType, platform, createdAt, updatedAt, confirmedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const insp of Object.values(data.inspirations)) {
    insStmt.run(
      insp.id,
      JSON.stringify(insp),
      insp.url || null,
      insp.title || null,
      insp.status || null,
      insp.venueType || null,
      insp.platform || null,
      insp.createdAt || null,
      insp.updatedAt || null,
      insp.confirmedAt || null
    );
  }
  const catStmt = db.prepare("INSERT INTO categories (id, data) VALUES (?, ?)");
  for (const c of data.categories) catStmt.run(c.id, JSON.stringify(c));
  const venStmt = db.prepare("INSERT INTO venueTypes (id, data) VALUES (?, ?)");
  for (const v of data.venueTypes) venStmt.run(v.id, JSON.stringify(v));
  db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(SETTINGS_KEY, JSON.stringify(data.settings || {}));
}
async function addInspiration2(insp) {
  const data = await loadData2();
  data.inspirations[insp.id] = insp;
  await saveData2(data);
}
async function updateInspiration2(id, patch) {
  const data = await loadData2();
  const existing = data.inspirations[id];
  if (!existing) return null;
  const updated = { ...existing, ...patch, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  data.inspirations[id] = updated;
  await saveData2(data);
  return updated;
}
async function deleteInspiration2(id) {
  const data = await loadData2();
  if (!data.inspirations[id]) return false;
  delete data.inspirations[id];
  await saveData2(data);
  await deleteImageRaw(`${id}.jpg`);
  await deleteImageRaw(`${id}.thumb.jpg`);
  return true;
}
async function findByUrl2(url) {
  const data = await loadData2();
  return Object.values(data.inspirations).find((i) => i.url === url) || null;
}
async function listInspirations2(filter) {
  const data = await loadData2();
  let list = Object.values(data.inspirations);
  if (filter?.subCategory) {
    const target = filter.subCategory;
    list = list.filter((i) => {
      if (Array.isArray(i.subCategories) && i.subCategories.length > 0) {
        return i.subCategories.includes(target);
      }
      return i.subCategory === target;
    });
  }
  if (filter?.venueType) list = list.filter((i) => i.venueType === filter.venueType);
  if (filter?.status) list = list.filter((i) => i.status === filter.status);
  if (filter?.platform) list = list.filter((i) => i.platform === filter.platform);
  if (filter?.startDate || filter?.endDate) {
    const start = filter?.startDate || "";
    const end = filter?.endDate || "";
    list = list.filter((i) => {
      const d = (i.createdAt || "").slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }
  if (filter?.keyword) {
    const k = filter.keyword.toLowerCase();
    list = list.filter((i) => {
      if ((i.title || "").toLowerCase().includes(k)) return true;
      if ((i.description || "").toLowerCase().includes(k)) return true;
      if ((i.tags || []).some((t) => t.toLowerCase().includes(k))) return true;
      if ((i.userNote || "").toLowerCase().includes(k)) return true;
      if ((i.visualDescription || "").toLowerCase().includes(k)) return true;
      if ((i.aiSuggestion?.visualDescription || "").toLowerCase().includes(k)) return true;
      const allTags = [...i.visualTags || [], ...i.aiSuggestion?.visualTags || []];
      if (allTags.some((t) => t.toLowerCase().includes(k))) return true;
      return false;
    });
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
async function saveImage2(inspirationId, imageBuffer, contentType) {
  await writeImageRaw(`${inspirationId}.jpg`, imageBuffer, contentType);
  return `${inspirationId}.jpg`;
}
async function getImage2(inspirationId) {
  return readImageRaw(`${inspirationId}.jpg`);
}
function getImageStore2() {
  return {
    get: async (key, opts) => {
      const result = await readImageRaw(key);
      if (!result) return null;
      if (opts?.type === "arrayBuffer") {
        return result.buffer.buffer.slice(
          result.buffer.byteOffset,
          result.buffer.byteOffset + result.buffer.byteLength
        );
      }
      return result.buffer;
    },
    set: async (key, value, opts) => {
      await writeImageRaw(key, value, opts?.metadata?.contentType || "image/jpeg");
    },
    getMetadata: async (key) => {
      if (IMAGE_BACKEND === "oss") {
        const client = await getOssClient();
        if (!client) return null;
        try {
          const head = await client.head(key);
          return { metadata: { contentType: head.res?.headers?.["content-type"] } };
        } catch {
          return null;
        }
      }
      const metaPath = path.join(IMAGE_DIR, key + ".meta");
      if (!fs.existsSync(metaPath)) return null;
      try {
        return { metadata: JSON.parse(fs.readFileSync(metaPath, "utf-8")) };
      } catch {
        return null;
      }
    }
  };
}
function setNetlifyContext2(_ctx) {
}
var path, fs, DatabaseSync, DB_PATH, IMAGE_BACKEND, IMAGE_DIR, _db, _ossClient, SETTINGS_KEY;
var init_storage_sqlite = __esm({
  "netlify/functions/lib/storage-sqlite.ts"() {
    "use strict";
    path = __toESM(require("path"));
    fs = __toESM(require("fs"));
    init_types();
    ({ DatabaseSync } = require("node:sqlite"));
    DB_PATH = process.env.DB_PATH || path.join(process.env.DATA_DIR || "/data", "inspiration.db");
    IMAGE_BACKEND = process.env.IMAGE_BACKEND || "local";
    IMAGE_DIR = process.env.IMAGE_DIR || path.join(process.env.DATA_DIR || "/data", "images");
    _db = null;
    _ossClient = null;
    SETTINGS_KEY = "main";
  }
});

// netlify/functions/scrape-page.ts
var scrape_page_exports = {};
__export(scrape_page_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(scrape_page_exports);

// netlify/functions/lib/scraper.ts
var USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
var TIMEOUT = 15e3;
async function scrapePage(url) {
  const empty = { title: "", description: "", coverImage: "" };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      },
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`Scrape ${url} got status ${res.status}`);
      return empty;
    }
    const html = await res.text();
    return parseHtml(html, url);
  } catch (e) {
    console.warn(`Scrape ${url} error:`, e);
    return empty;
  }
}
function parseHtml(html, url) {
  const result = { title: "", description: "", coverImage: "" };
  result.title = extractMeta(html, "og:title") || extractTitle(html);
  result.description = extractMeta(html, "og:description") || extractMeta(html, "description");
  result.coverImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
  if (result.coverImage && !result.coverImage.startsWith("http")) {
    try {
      result.coverImage = new URL(result.coverImage, url).toString();
    } catch {
      result.coverImage = "";
    }
  }
  return result;
}
function extractMeta(html, name) {
  const re = new RegExp(
    `<meta\\s+[^>]*?(?:property|name)=["']${escapeReg(name)}["'][^>]*?content=["']([^"']*?)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return decodeHtml(m[1]);
  const re2 = new RegExp(
    `<meta\\s+[^>]*?content=["']([^"']*?)["'][^>]*?(?:property|name)=["']${escapeReg(name)}["']`,
    "i"
  );
  const m2 = html.match(re2);
  if (m2) return decodeHtml(m2[1]);
  return "";
}
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtml(m[1].trim()) : "";
}
function decodeHtml(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}
function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// netlify/functions/lib/ai.ts
init_types();

// netlify/functions/lib/storage.ts
var backend = process.env.DATA_BACKEND === "blobs" ? (init_storage_blobs(), __toCommonJS(storage_blobs_exports)) : (init_storage_sqlite(), __toCommonJS(storage_sqlite_exports));
var {
  loadData: loadData3,
  saveData: saveData3,
  addInspiration: addInspiration3,
  updateInspiration: updateInspiration3,
  deleteInspiration: deleteInspiration3,
  findByUrl: findByUrl3,
  listInspirations: listInspirations3,
  saveImage: saveImage3,
  getImage: getImage3,
  getImageStore: getImageStore3,
  setNetlifyContext: setNetlifyContext3
} = backend;

// netlify/functions/lib/ai.ts
var import_sharp = __toESM(require("sharp"));
var QWEN_API = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
var DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";
function buildSystemPrompt(categories, venueTypes) {
  const categoryLib = categories.map((c) => {
    let desc = `- **${c.id}\uFF08${c.name}\uFF09**\uFF1A${c.description || ""}`;
    if (c.rules && c.rules.length > 0) {
      desc += `
  \u{1F4CC} \u7528\u6237\u89C4\u5219\uFF1A${c.rules.slice(-5).join("\uFF1B")}`;
    }
    return desc;
  }).join("\n");
  const venueLib = venueTypes.map(
    (v) => `- **${v.id}\uFF08${v.name}\uFF09**\uFF1A${v.description || ""}`
  ).join("\n");
  return `\u4F60\u662F\u5C55\u9648\uFF08\u5C55\u89C8\u9648\u5217\uFF09\u884C\u4E1A\u7684\u8D44\u6DF1\u7B56\u5C55\u4EBA\u52A9\u7406\uFF0C\u5E2E\u7B56\u5C55\u4EBA\u5FEB\u901F\u5224\u65AD"\u770B\u5230\u7684\u7D20\u6750"\u5C5E\u4E8E\u54EA\u4E9B\u5206\u7C7B\u3002

\u26A0\uFE0F\u26A0\uFE0F\u26A0\uFE0F \u5F3A\u5236\u786C\u89C4\u5219\uFF08\u8FDD\u53CD\u4EFB\u4F55\u4E00\u4E2A = \u9519\u8BEF\u5224\u65AD\uFF09\u26A0\uFE0F\u26A0\uFE0F\u26A0\uFE0F
1. **\u5FC5\u987B\u771F\u7684\u770B\u56FE**\uFF1A\u4EC5\u9760\u6807\u9898/\u5E73\u53F0/\u5E38\u8BC6\u731C\u6D4B = \u9519\u8BEF\u3002\u770B\u5230\u56FE\u91CC\u6709\u4EC0\u4E48\uFF0C\u5C31\u57FA\u4E8E\u4EC0\u4E48\u5224\u65AD\u3002
2. **\u5360\u4F4D\u6807\u9898\u8B66\u544A**\uFF1A\u5982\u679C\u6807\u9898\u662F"\u5F85\u6574\u7406"/"\u52A0\u8F7D\u4E2D..."/"\u65E0\u6807\u9898"\u7B49\u5360\u4F4D\u7B26\uFF0C**\u7B49\u540C\u4E8E\u65E0\u6807\u9898**\u2014\u2014\u4E0D\u8981\u4ECE\u8FD9\u4E9B\u8BCD\u63A8\u65AD\u5185\u5BB9\uFF08\u5B83\u4EEC\u6CA1\u6709\u4FE1\u606F\u91CF\uFF09\u3002\u540C\u7406\u5E73\u53F0="other"\u6216\u6CA1\u6709\u5E73\u53F0\u4FE1\u606F\u65F6\uFF0C\u4E0D\u8981\u7528"\u5C0F\u7EA2\u4E66\u90FD\u662F\u4F01\u4E1A\u5BA3\u4F20"\u8FD9\u79CD\u504F\u89C1\u3002
3. **\u89C6\u89C9\u7279\u5F81\u662F\u552F\u4E00\u53EF\u4FE1\u4FE1\u53F7**\uFF1A\u6807\u9898\u53EA\u7528\u4E8E\u8F85\u52A9\u7406\u89E3\uFF08\u770B\u5230"\u79D1\u5E03\u4F26\u8328\u5DDE\u7ACB\u535A\u7269\u9986"\u8FD9\u79CD\u5B9E\u8BCD\u624D\u6709\u7528\uFF09\uFF0C\u5E73\u53F0\u3001\u6807\u7B7E\u90FD\u662F\u6B21\u8981\u7684\u3002
4. **\u4E0D\u786E\u5B9A\u5C31\u964D confidence**\uFF1A\u5B81\u53EF confidence \u7ED9 30-50 \u6807"\u5F85\u786E\u8BA4"\uFF0C\u4E5F\u4E0D\u8981\u786C\u731C\u4E00\u4E2A\u9519\u7B54\u6848\u3002

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u3010\u4EFB\u52A1\u3011\u4ECE\u3010\u5F62\u5F0F\u5C0F\u7C7B\u3011+\u3010\u5C55\u9986\u7C7B\u578B\u3011\u4E24\u4E2A\u7EF4\u5EA6\u5224\u65AD
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u3010\u5F62\u5F0F\u5C0F\u7C7B\u5224\u65AD\u6807\u51C6\u3011(6 \u7C7B\uFF0C\u53EF\u591A\u9009\uFF0C\u5EFA\u8BAE 1-3 \u4E2A)
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

1. **multimedia\uFF08\u591A\u5A92\u4F53\uFF09**
   \u89C6\u89C9\u7279\u5F81\uFF1A\u80FD\u770B\u5230\u660E\u663E\u4E3B\u4F53\u4F7F\u7528\u4E86 LED \u5C4F\u3001\u6295\u5F71\u3001\u706F\u5149\u4E92\u52A8\u7B49\u58F0\u5149\u7535\u6280\u672F\uFF1B\u6574\u4F53\u753B\u9762\u70AB\u9177\u3001\u6709\u52A8\u6001\u5149\u5F71\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u753B\u9762\u660E\u663E\u6709\u5C4F\u5E55/\u5149\u675F/\u5149\u6591/\u52A8\u6001\u5143\u7D20\u3002

2. **installation\uFF08\u88C5\u7F6E\uFF09**
   \u89C6\u89C9\u7279\u5F81\uFF1A\u56FE\u7247\u805A\u7126\u6838\u5FC3\u4E3A\u9020\u578B\u590D\u6742\u6216\u5938\u5F20\u7684\u88C5\u7F6E\uFF1B\u5E38\u4F7F\u7528\u9635\u5217\u624B\u6CD5\uFF08\u91CD\u590D\u3001\u7EC4\u5408\u3001\u89C4\u6A21\u5316\uFF09\uFF1B\u5730\u5F62\u6C99\u76D8\u4E5F\u5F52\u6B64\u7C7B\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u753B\u9762\u4E2D\u5FC3\u662F\u4E00\u4E2A\u88AB\u805A\u7126\u7684\u3001\u9020\u578B\u5316\u7684\u5B9E\u4F53\u4F5C\u54C1\uFF08\u975E\u5C4F\u5E55\uFF09\u3002

3. **material\uFF08\u65B0\u6750\u6599\uFF09**
   \u89C6\u89C9\u7279\u5F81\uFF1A\u6574\u4F53\u753B\u9762\u8F83\u96BE\u770B\u51FA\u91CD\u70B9\uFF0C\u4F46\u67D0\u5904\u4F7F\u7528\u7684\u6750\u8D28\u8F83\u4E3A\u7279\u6B8A\u3002
   \u5178\u578B\u6750\u8D28\uFF1A\u73BB\u7483\u3001\u5CA9\u677F\u3001\u675C\u90A6\u7EB8\u3001\u7A7F\u5B54\u677F\u3001\u4E9A\u514B\u529B\u3001\u592F\u571F\u3001\u955C\u9762\u3001\u91D1\u5C5E\u7F51\u3001\u7279\u6B8A\u6D82\u6599\u3001\u65B0\u578B\u7EC7\u7269\u3002
   \u26A0\uFE0F \u91CD\u8981\uFF1Amaterial \u662F"\u515C\u5E95\u7C7B"\u2014\u2014**\u53EA\u5728\u4E3B\u4F53\u4E0D\u6E05\u6670\u3001\u65E0\u6CD5\u7528\u5176\u4ED6\u4E3B\u6807\u7B7E\u8868\u8FBE\u65F6\u624D\u7528**\uFF1B\u4E00\u65E6\u6709\u6E05\u6670\u4E3B\u4F53\uFF08LED \u5C4F\u3001\u88C5\u7F6E\u3001\u5C55\u54C1\uFF09\uFF0C\u6309\u4E3B\u4F53\u5206\u7C7B\u3002

4. **layout\uFF08\u7248\u9762\uFF09**
   \u89C6\u89C9\u7279\u5F81\uFF1A\u56FE\u7247\u4E2D\u6CA1\u6709\u7EDD\u5BF9\u7684\u6838\u5FC3\u4E3B\u89C6\u89C9\uFF0C\u80FD\u770B\u5230\u4E00\u6BB5\u6216\u591A\u4E2A\u5899\u9762\u7684\u6392\u7248\uFF1B\u6709\u4EAE\u773C\u7684\u7248\u9762\u914D\u8272\u6216\u7279\u6B8A\u7684\u7248\u9762\u9020\u578B\uFF08\u5706\u5F62\u3001\u4E09\u89D2\u5F62\u3001\u5F02\u5F62\u7B49\uFF09\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u753B\u9762\u662F\u8FDE\u7EED\u7684\u3001\u94FA\u6EE1\u5899\u9762\u7684\u56FE\u6587\u7EC4\u5408\u3002

5. **space\uFF08\u7279\u6B8A\u7A7A\u95F4\u5904\u7406\uFF09**
   \u89C6\u89C9\u7279\u5F81\uFF1A\u7A7A\u95F4\u975E\u666E\u901A\u5E38\u89C4\u6BD4\u4F8B\u7684\u56DB\u65B9\u7A7A\u95F4\uFF1B\u7279\u5F81\u5305\u62EC\uFF1A\u9876\u90E8\u7A79\u9876\u3001\u7A7A\u95F4\u6709\u67F1\u5B50\u3001\u957F\u8D70\u5ECA\u3001\u8DC3\u5C42\u3001\u5939\u5C42\u3001\u60AC\u6311\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u5EFA\u7B51\u7A7A\u95F4\u672C\u8EAB\u662F"\u4E3B\u89D2"\uFF0C\u800C\u4E0D\u662F\u88C5\u9970\u3002

6. **display\uFF08\u5C55\u67DC\u67DC\u5185\u8BBE\u8BA1\uFF09**
   \u89C6\u89C9\u7279\u5F81\uFF1A\u56FE\u7247\u4E2D\u53EF\u4EE5\u770B\u5230\u660E\u663E\u7684\u5C55\u67DC\uFF1B\u91CD\u70B9\u5173\u6CE8\u67DC\u5185\u6587\u7269/\u5C55\u54C1\u7684\u6446\u653E\u65B9\u5F0F\u3001\u706F\u5149\u5E03\u7F6E\u3001\u80CC\u666F\u886C\u677F\u3001\u7ACB\u4F53\u573A\u666F\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u80FD\u770B\u5230\u5C55\u67DC\u73BB\u7483 + \u67DC\u5185\u5C55\u54C1\u7684\u7EC4\u5408\u3002

\u3010\u591A\u9009\u4E0E\u8FB9\u754C\u89C4\u5219\u3011
- \u4E00\u4E2A\u7D20\u6750\u53EF\u540C\u65F6\u5C5E\u4E8E\u591A\u4E2A\u5F62\u5F0F\uFF0C\u9F13\u52B1\u8BC6\u522B 1-3 \u4E2A\uFF1B\u6309"\u4E3B\u5BFC\u89C6\u89C9"\u6392\u5E8F\uFF0C\u6700\u4E3B\u8981\u7684\u653E\u7B2C\u4E00\u4E2A
- **LED \u5C4F\u9020\u578B\u7279\u6B8A**\uFF1A\u53EF\u4EE5\u540C\u65F6\u6253"\u591A\u5A92\u4F53"+"\u88C5\u7F6E"\uFF08\u591A\u9009\uFF09
- **\u4E0D\u8981\u628A 6 \u4E2A\u6807\u7B7E\u5168\u6253\u4E0A**\u2014\u2014\u5B81\u53EF\u5C11\u800C\u51C6\uFF08\u4E00\u822C 1-3 \u4E2A\uFF09
- \u7248\u9762 vs \u5C55\u67DC\u67DC\u5185\u8BBE\u8BA1\uFF1A
  - \u5C55\u67DC\u73BB\u7483 + \u67DC\u5185\u5C55\u54C1\u7EC4\u5408 \u2192 display
  - \u5C55\u67DC\u5916\u7684\u5C55\u5899\u56FE\u6587 \u2192 layout

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u3010\u5C55\u9986\u7C7B\u578B\u5224\u65AD\u6807\u51C6\u3011(3 \u7C7B\uFF0C\u5355\u9009)
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

1. **museum\uFF08\u535A\u7269\u9986\uFF09**
   \u4E3B\u9898\uFF1A\u5C55\u73B0\u67D0\u57CE\u5E02/\u5730\u533A/\u67D0\u4E3B\u9898\u6587\u5316\u4ECE\u53E4\u81F3\u4ECA\u7684\u53D1\u5C55\u53F2\u3002
   **\u3010\u7B2C\u4E00\u5224\u65AD\xB7\u56FE\u6587\u5185\u5BB9\u3011**\uFF1A\u770B\u5230**\u6587\u7269\u3001\u8003\u53E4\u6807\u672C\u3001\u6A21\u578B\u3001\u6587\u732E\u3001\u5C55\u67DC\u9648\u5217\u7269**\u7B49\u591A\u4E3A\u535A\u7269\u9986\u3002
   **\u3010\u7B2C\u4E8C\u5224\u65AD\xB7\u8F85\u52A9\u7279\u5F81\u3011**\uFF1A\u5E38\u4F7F\u7528\u5C55\u67DC\u653E\u7F6E\uFF1B\u7A7A\u95F4\u76F8\u5BF9\u8F83\u6697\uFF08\u805A\u5149\u7167\u660E\u7A81\u51FA\u5C55\u54C1\uFF09\u3002
   **\u3010\u4E2D\u5F0F\u5143\u7D20\u4FE1\u53F7\u3011**\uFF1A\u770B\u5230**\u5377\u8F74\u3001\u767D\u5899\u7070\u74E6\u3001\u4E2D\u5F0F\u5EFA\u7B51\u6784\u4EF6**\uFF08\u98DE\u6A90\u3001\u6597\u62F1\u3001\u96D5\u82B1\u7A97\u683C\u3001\u6708\u6D1E\u95E8\u7B49\uFF09\u7B49\u4E2D\u5F0F\u5143\u7D20\uFF0C\u591A\u4E3A\u535A\u7269\u9986\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u6587\u7269/\u5C55\u54C1\u5185\u5BB9 + \u6697\u7A7A\u95F4 + \u5C55\u67DC\uFF1B\u6216\u660E\u663E\u7684\u4E2D\u5F0F\u5EFA\u7B51/\u88C5\u9970\u5143\u7D20\u3002

2. **memorial\uFF08\u7EAA\u5FF5\u9986\uFF09**
   **\u3010\u7B2C\u4E00\u5224\u65AD\xB7\u56FE\u6587\u5185\u5BB9\u3011**\uFF1A
   - \u9769\u547D\u5386\u53F2\u7C7B\uFF08\u591A\u6570\uFF09\uFF1A\u5899\u9762\u7248\u9762\u7684\u56FE\u6587\u4EE5**\u9ED1\u767D\u6218\u4E89/\u9769\u547D\u76F8\u5173\u7167\u7247**\u4E3A\u4E3B\u3002
   - \u4EBA\u7269\u7EAA\u5FF5\u9986\uFF1A\u5899\u9762\u80FD\u770B\u5230\u660E\u663E\u7684\u4EBA\u7269\u5934\u50CF\uFF08\u6CB9\u753B\u3001\u7167\u7247\u3001\u96D5\u5851\u7B49\uFF09\u3002
   **\u3010\u7B2C\u4E8C\u5224\u65AD\xB7\u8F85\u52A9\u7279\u5F81\u3011**\uFF1A\u9769\u547D\u5386\u53F2\u7C7B\u7248\u9762\u914D\u8272\u591A\u7528\u7EA2\u8272\uFF08\u7EA2+\u9ED1\u3001\u7EA2+\u767D\u7B49\uFF09\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u9ED1\u767D\u8001\u7167\u7247 / \u4EBA\u7269\u5934\u50CF + \u7EA2\u8272\u914D\u8272\uFF08\u4EFB\u4E00\u4E8C\u9879\u5373\u53EF\uFF09\u3002

3. **corporate\uFF08\u4F01\u4E1A\u9986\uFF09**
   \u4E3B\u9898\uFF1A\u5C55\u793A\u4F01\u4E1A\u6587\u5316\u3001\u54C1\u724C\u5386\u53F2\u3001\u4EA7\u54C1\u6280\u672F\u3002
   **\u3010\u7B2C\u4E00\u5224\u65AD\xB7\u56FE\u6587\u5185\u5BB9\u3011**\uFF1A\u770B\u5230**\u4F01\u4E1A Logo\u3001\u4F01\u4E1A\u6D3B\u52A8\u56FE\u3001\u4EA7\u54C1\u56FE\u3001\u4E1A\u52A1\u8BF4\u660E UI/\u754C\u9762\u3001\u54C1\u724C\u5386\u53F2\u56FE\u7247**\u7B49\u591A\u4E3A\u4F01\u4E1A\u9986\u3002
   **\u3010\u7B2C\u4E8C\u5224\u65AD\xB7\u8F85\u52A9\u7279\u5F81\u3011**\uFF1A\u7248\u9762\u914D\u8272\u591A\u7528\u84DD/\u7EFF\u8272\uFF0C\u642D\u914D\u767D/\u6728/\u9ED1\u7070\u7B49\u4E2D\u6027\u8272\uFF1B\u6574\u4F53\u7B80\u7EA6\u73B0\u4EE3\uFF1B\u8F83\u591A\u4F7F\u7528\u91D1\u5C5E\u6750\u8D28\uFF08\u62C9\u4E1D\u4E0D\u9508\u94A2\u3001\u94DD\u5408\u91D1\u7B49\uFF09\u3002
   \u5F3A\u4FE1\u53F7\uFF1A\u4F01\u4E1A\u4EA7\u54C1/\u4E1A\u52A1\u56FE + \u84DD/\u7EFF/\u767D\u914D\u8272 + \u91D1\u5C5E\u6750\u8D28\u3002

\u3010\u8FB9\u754C\u5224\u65AD\u4F18\u5148\u7EA7\u3011

**\u7B2C\u4E00\u6B65\uFF1A\u5148\u770B\u56FE\u6587\u5185\u5BB9**\uFF08\u51B3\u5B9A\u4E3B\u5224\u65AD\uFF09
- \u770B\u5230\u6587\u7269\u3001\u8003\u53E4\u6807\u672C\u3001\u6A21\u578B\u3001\u6587\u732E\u3001\u5C55\u67DC\u9648\u5217 \u2192 \u535A\u7269\u9986
- \u770B\u5230\u9ED1\u767D\u8001\u7167\u7247\u3001\u9769\u547D\u5386\u53F2\u7167\u7247\u3001\u4EBA\u7269\u5934\u50CF/\u8096\u50CF \u2192 \u7EAA\u5FF5\u9986
- \u770B\u5230\u4F01\u4E1A Logo\u3001\u4F01\u4E1A\u4EA7\u54C1\u56FE\u3001\u4E1A\u52A1\u8BF4\u660E UI\u3001\u54C1\u724C\u5386\u53F2\u56FE\u7247 \u2192 \u4F01\u4E1A\u9986

**\u7B2C\u4E8C\u6B65\uFF1A\u56FE\u6587\u6A21\u7CCA\u65F6\uFF0C\u770B\u8F85\u52A9\u7279\u5F81**\uFF08\u914D\u8272 + \u7A7A\u95F4\u5149\u73AF\u5883\uFF09
- \u535A\u7269\u9986\uFF1A\u6697\u7A7A\u95F4 + \u5C55\u67DC\u805A\u5149 + \u4E2D\u5F0F\u5143\u7D20
- \u7EAA\u5FF5\u9986\uFF1A\u7EA2+\u9ED1 / \u7EA2+\u767D \u914D\u8272
- \u4F01\u4E1A\u9986\uFF1A\u84DD/\u7EFF/\u767D \u914D\u8272 + \u91D1\u5C5E\u6750\u8D28 + \u7B80\u7EA6\u73B0\u4EE3\u98CE

**\u5B9E\u5728\u5206\u4E0D\u6E05** \u2192 confidence \u2264 50\uFF0C\u8BA9\u7528\u6237\u624B\u52A8\u786E\u8BA4

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u3010\u5F53\u524D\u7CFB\u7EDF\u5206\u7C7B\u5E93\uFF08\u7528\u6237\u53EF\u6539\uFF0C\u5B9A\u4E49\u8865\u5145\uFF09\u3011
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

\u5F62\u5F0F\u5C0F\u7C7B\uFF1A
${categoryLib}

\u5C55\u9986\u7C7B\u578B\uFF1A
${venueLib}

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u3010\u8F93\u51FA\u683C\u5F0F\u3011
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

\u5FC5\u987B\u53EA\u8FD4\u56DE JSON\uFF0C\u4E0D\u8981\u4EFB\u4F55\u89E3\u91CA\uFF1A
{
  "categories": ["multimedia", "installation"],
  "venueType": "museum",
  "confidence": 85,
  "reasoning": "\u56FE\u4E2D\u662F LED \u5C4F + \u6295\u5F71\u7EC4\u5408\u7684\u4E92\u52A8\u88C5\u7F6E\uFF0C\u535A\u7269\u9986\u6697\u7A7A\u95F4 + \u6587\u7269\u5C55\u67DC\u98CE\u683C\u660E\u663E",
  "visualDescription": "\u6DF1\u8272\u5C55\u5385\u4E2D\u4E00\u5EA7 2 \u7C73\u9AD8\u7684\u516D\u8FB9\u5F62 LED \u88C5\u7F6E\uFF0C\u8868\u9762\u64AD\u653E\u84DD\u8272\u6C34\u6CE2\u7EB9\u5F71\u50CF\uFF1B\u5730\u9762\u662F\u7070\u8272\u6C34\u6CE5\uFF0C\u5468\u56F4\u7528\u4F4E\u89D2\u5EA6\u6696\u5149\u805A\u5149\uFF0C\u6574\u4F53\u79D1\u6280\u611F\u5F3A\u3001\u6C1B\u56F4\u6C89\u9759",
  "visualTags": ["\u6DF1\u8272", "LED\u5C4F", "\u84DD\u8272", "\u79D1\u6280\u611F", "\u805A\u5149", "\u51E0\u4F55", "\u4E92\u52A8"]
}

\u3010visualDescription \u5199\u4F5C\u8981\u6C42\u3011(\u4F9B"\u5E2E\u4F60\u627E"\u641C\u7D22\u7528)
- 100-150 \u5B57\uFF0C\u753B\u9762\u611F\u5F3A\uFF0C\u8BA9\u4EBA\u8BFB\u6587\u5B57\u5C31\u80FD"\u770B\u89C1"\u8FD9\u5F20\u56FE
- \u91CD\u70B9\u5199\u89C6\u89C9\u7279\u5F81\uFF1A\u989C\u8272\uFF08\u6DF1/\u6D45/\u6696/\u51B7 + \u5177\u4F53\u8272\uFF09\u3001\u6750\u8D28\uFF08\u91D1\u5C5E/\u6728/\u73BB\u7483/\u6DF7\u51DD\u571F/\u7EC7\u7269\u7B49\uFF09\u3001\u5149\u7EBF\uFF08\u805A\u5149/\u6F2B\u5C04/\u660E/\u6697/\u6696/\u51B7\uFF09\u3001\u7A7A\u95F4\u611F\uFF08\u9AD8/\u4F4E/\u5F00\u9614/\u538B\u6291\uFF09\u3001\u6784\u56FE\uFF08\u4E2D\u5FC3/\u5BF9\u79F0/\u6563\u70B9/\u9635\u5217\uFF09\u3001\u52A8\u6001\u5143\u7D20\uFF08\u5C4F/\u5149/\u5F71/\u6C34\uFF09
- \u4E0D\u5199\u5C55\u54C1\u540D\u79F0\u3001\u535A\u7269\u9986\u540D\u7B49\u5177\u4F53\u5B9E\u4F53\uFF08\u907F\u514D\u641C\u7D22\u65F6\u8FC7\u62DF\u5408\uFF09
- \u4E0D\u5199"\u8FD9\u5F20\u56FE\u662F..."\u8FD9\u79CD\u5143\u63CF\u8FF0\uFF0C\u76F4\u63A5\u63CF\u8FF0\u753B\u9762

\u3010visualTags \u5199\u4F5C\u8981\u6C42\u3011
- 5-8 \u4E2A\u5173\u952E\u8BCD\uFF0C\u9017\u53F7\u5206\u9694
- \u4F18\u5148\u89C6\u89C9\u7279\u5F81\u8BCD\uFF1A\u989C\u8272\u540D\u3001\u6750\u8D28\u540D\u3001\u5149\u7EBF\u8BCD\u3001\u6784\u56FE\u8BCD
- \u907F\u514D\u62BD\u8C61\u8BCD\uFF08"\u7F8E""\u6709\u611F\u89C9""\u4E0D\u9519"\uFF09
- \u7528\u4E8E"\u627E\u56FE"\u65F6\u505A\u5173\u952E\u8BCD\u53EC\u56DE

\u3010confidence \u6307\u5BFC\u3011
- 90-100\uFF1A\u89C6\u89C9\u7279\u5F81\u975E\u5E38\u660E\u786E\uFF08\u22652 \u4E2A\u5F3A\u4FE1\u53F7\uFF09
- 70-89\uFF1A\u6709 1-2 \u4E2A\u660E\u663E\u7279\u5F81\uFF0C\u53EF\u4FE1
- 50-69\uFF1A\u7279\u5F81\u6A21\u7CCA\uFF0C\u53EF\u80FD\u9519\u5224
- 30-49\uFF1A\u4FE1\u606F\u4E0D\u8DB3\uFF0C\u5EFA\u8BAE\u4EBA\u5DE5\u786E\u8BA4
- 0-29\uFF1A\u5B8C\u5168\u770B\u4E0D\u6E05`;
}
async function aiClassify(input) {
  const qwenKey = process.env.QWEN_API_KEY;
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!qwenKey && !deepseekKey) {
    return defaultClassification("\u672A\u914D\u7F6E AI Key");
  }
  const categories = input.categories && input.categories.length > 0 ? input.categories : DEFAULT_CATEGORIES;
  const venueTypes = input.venueTypes && input.venueTypes.length > 0 ? input.venueTypes : DEFAULT_VENUE_TYPES;
  if (!input.title && !input.description && !input.imageBase64) {
    return defaultClassification("\u4FE1\u606F\u4E0D\u8DB3");
  }
  const useQwen = !!qwenKey;
  const apiUrl = useQwen ? QWEN_API : DEEPSEEK_API;
  const apiKey = useQwen ? qwenKey : deepseekKey;
  const hasImage = !!(input.imageBase64 || input.coverImage);
  const model = useQwen ? hasImage ? "qwen-vl-max" : "qwen-plus" : "deepseek-chat";
  const t0 = Date.now();
  const systemPrompt = buildSystemPrompt(categories, venueTypes);
  console.log(`[ai] prompt built: ${Date.now() - t0}ms, model=${model}`);
  const textContent = [
    `\u5E73\u53F0\uFF1A${input.platform}`,
    input.title ? `\u6807\u9898\uFF1A${input.title}` : "",
    input.description ? `\u63CF\u8FF0\uFF1A${input.description}` : ""
  ].filter(Boolean).join("\n");
  const messages = [
    { role: "system", content: systemPrompt }
  ];
  let imageBase64ForQwen = input.imageBase64;
  let imageMimeForQwen = "image/jpeg";
  if (!imageBase64ForQwen && input.coverImage) {
    const localMatch = input.coverImage.match(/\/api\/image\/([A-Za-z0-9_]+)/);
    if (localMatch) {
      try {
        const result = await getImage3(localMatch[1]);
        if (result) {
          const resized = await (0, import_sharp.default)(result.buffer).rotate().resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
          imageBase64ForQwen = resized.toString("base64");
          imageMimeForQwen = "image/jpeg";
          console.log(`[ai] image processed: ${result.buffer.length} -> ${resized.length} bytes`);
        }
      } catch (e) {
        console.warn(`[ai] getImage/sharp error: ${e.message}`);
      }
    } else {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6e3);
        const imgRes = await fetch(input.coverImage, { signal: controller.signal });
        clearTimeout(timer);
        if (imgRes.ok) {
          const raw = Buffer.from(await imgRes.arrayBuffer());
          const resized = await (0, import_sharp.default)(raw).rotate().resize({ width: 800, withoutEnlargement: true }).jpeg({ quality: 70, mozjpeg: true }).toBuffer();
          imageBase64ForQwen = resized.toString("base64");
          imageMimeForQwen = "image/jpeg";
        } else {
          console.warn(`[ai] fetch image failed: ${imgRes.status}`);
        }
      } catch (e) {
        console.warn(`[ai] fetch image error: ${e.message}`);
      }
    }
  }
  if (imageBase64ForQwen) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: textContent || "\u8BF7\u770B\u56FE\u5224\u65AD\uFF1A" },
        { type: "image_url", image_url: { url: `data:${imageMimeForQwen};base64,${imageBase64ForQwen}` } }
      ]
    });
  } else if (input.coverImage) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: textContent || "\u8BF7\u770B\u56FE\u5224\u65AD\uFF1A" },
        { type: "image_url", image_url: { url: input.coverImage } }
      ]
    });
  } else {
    messages.push({ role: "user", content: textContent });
  }
  try {
    const tApi = Date.now();
    console.log(`[ai] calling ${model}, imageBase64Len=${imageBase64ForQwen?.length || 0}, elapsed ${tApi - t0}ms`);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`AI API error: ${res.status} - ${errText.slice(0, 500)}`);
      return defaultClassification(`AI ${res.status}: ${errText.slice(0, 100)}`);
    }
    const data = await res.json();
    console.log(`[ai] API call done: ${Date.now() - tApi}ms (total ${Date.now() - t0}ms)`);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return defaultClassification("AI \u8FD4\u56DE\u4E3A\u7A7A");
    const parsed = JSON.parse(content);
    let catIds = [];
    if (Array.isArray(parsed.categories)) {
      catIds = parsed.categories.filter((id) => typeof id === "string");
    } else if (typeof parsed.category === "string") {
      catIds = [parsed.category];
    }
    catIds = catIds.filter((id) => categories.some((c) => c.id === id));
    if (catIds.length === 0) catIds = [categories[0].id];
    const cats = catIds.map((id) => categories.find((c) => c.id === id));
    const venue = venueTypes.find((v) => v.id === parsed.venueType);
    return {
      subCategories: cats.map((c) => c.id),
      subCategoryNames: cats.map((c) => c.name),
      venueType: venue?.id || venueTypes[0].id,
      venueTypeName: venue?.name || venueTypes[0].name,
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      reasoning: parsed.reasoning || "",
      visualDescription: typeof parsed.visualDescription === "string" ? parsed.visualDescription.trim().slice(0, 300) : "",
      visualTags: Array.isArray(parsed.visualTags) ? parsed.visualTags.filter((t) => typeof t === "string").slice(0, 10).map((t) => t.trim()) : []
    };
  } catch (e) {
    console.error("AI classify error:", e);
    return defaultClassification("AI \u8C03\u7528\u5F02\u5E38");
  }
}
function defaultClassification(reason) {
  return {
    subCategories: ["multimedia"],
    subCategoryNames: ["\u591A\u5A92\u4F53"],
    venueType: "museum",
    venueTypeName: "\u535A\u7269\u9986",
    confidence: 0,
    reasoning: reason + "\uFF0C\u9700\u8981\u624B\u52A8\u5206\u7C7B",
    visualDescription: "",
    visualTags: []
  };
}

// netlify/functions/lib/utils.ts
function jsonResponse(data, status = 200) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    },
    body: JSON.stringify(data)
  };
}
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
async function requireAuth(event) {
  const token = process.env.API_TOKEN;
  if (!token) return true;
  const header = event.headers["x-auth-token"] || event.headers["X-Auth-Token"];
  return header === token;
}

// netlify/functions/lib/handler.ts
function withContext(fn) {
  return async (event, context) => {
    setNetlifyContext3(context);
    return fn(event, context);
  };
}

// netlify/functions/scrape-page.ts
var _innerHandler = async (event, _ctx) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse({ ok: true });
  if (event.httpMethod !== "POST") return errorResponse("Method not allowed", 405);
  if (!await requireAuth(event)) return errorResponse("Unauthorized", 401);
  try {
    const body = JSON.parse(event.body || "{}");
    const { id } = body;
    if (!id) return errorResponse("Missing id");
    const data = await loadData3();
    const insp = data.inspirations[id];
    if (!insp) return errorResponse("Inspiration not found", 404);
    const scraped = await scrapePage(insp.url);
    const aiResult = await aiClassify({
      title: scraped.title || insp.title,
      description: scraped.description,
      coverImage: scraped.coverImage,
      platform: insp.platform,
      categories: data.categories,
      venueTypes: data.venueTypes
    });
    const updated = await updateInspiration3(id, {
      title: scraped.title || insp.title,
      description: scraped.description,
      coverImage: scraped.coverImage,
      aiSuggestion: aiResult,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return jsonResponse({ success: true, inspiration: updated });
  } catch (e) {
    return errorResponse(e.message || "Internal error", 500);
  }
};
var handler = withContext((event, context) => _innerHandler(event, context));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
