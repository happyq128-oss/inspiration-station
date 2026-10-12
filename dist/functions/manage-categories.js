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

// netlify/functions/manage-categories.ts
var manage_categories_exports = {};
__export(manage_categories_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(manage_categories_exports);

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

// netlify/functions/manage-categories.ts
init_types();

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

// netlify/functions/manage-categories.ts
var _innerHandler = async (event, _ctx) => {
  if (event.httpMethod === "OPTIONS") return jsonResponse({ ok: true });
  if (!await requireAuth(event)) return errorResponse("Unauthorized", 401);
  const data = await loadData3();
  if (event.httpMethod === "GET") {
    return jsonResponse({
      success: true,
      categories: data.categories || DEFAULT_CATEGORIES,
      venueTypes: data.venueTypes || DEFAULT_VENUE_TYPES
    });
  }
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { categories, venueTypes } = body;
      if (Array.isArray(categories)) {
        for (const c of categories) {
          if (!c.id || !c.name) return errorResponse("Each category must have id and name");
        }
        data.categories = categories;
      }
      if (Array.isArray(venueTypes)) {
        for (const v of venueTypes) {
          if (!v.id || !v.name) return errorResponse("Each venueType must have id and name");
        }
        data.venueTypes = venueTypes;
      }
      await saveData3(data);
      return jsonResponse({
        success: true,
        categories: data.categories,
        venueTypes: data.venueTypes
      });
    } catch (e) {
      return errorResponse(e.message, 500);
    }
  }
  return errorResponse("Method not allowed", 405);
};
var handler = withContext((event, context) => _innerHandler(event, context));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
