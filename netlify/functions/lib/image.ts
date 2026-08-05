// netlify/functions/lib/image.ts
// 上传图片处理：640px 主图 + 240px 缩略图
// 主图用于网页展示 / 帮你找 AI 识别
// 缩略图用于 Excel 嵌入（避免 Excel 文件膨胀）

import sharp from 'sharp';
import { getImageStore } from './storage';

const MAIN_WIDTH = 640;
const MAIN_QUALITY = 75;
const THUMB_WIDTH = 240;
const THUMB_QUALITY = 70;

/**
 * 处理并保存上传图片
 * - 输入：原始 buffer（任意格式：JPEG/PNG/HEIC 等）
 * - 输出：主图（640px 宽 JPEG）+ 缩略图（240px 宽 JPEG）存到 Blobs
 * - 返回：{ mainUrl, thumbUrl, originalSize, mainSize, thumbSize }
 *
 * 失败时返回 null（不抛异常，调用方决定降级）
 */
export async function processAndSaveImage(
  inspirationId: string,
  inputBuffer: Buffer,
): Promise<{
  mainUrl: string;
  thumbUrl: string;
  mainSize: number;
  thumbSize: number;
  originalSize: number;
} | null> {
  if (!inputBuffer || inputBuffer.length === 0) return null;
  // 上限保护：原始图 10MB（iPhone 截图通常 1-3MB）
  if (inputBuffer.length > 10 * 1024 * 1024) {
    console.warn(`[image] input too large: ${inputBuffer.length} bytes, skip`);
    return null;
  }

  const originalSize = inputBuffer.length;

  try {
    // 一次性生成两个尺寸（sharp pipeline 一次解码两次输出，更快）
    const pipeline = sharp(inputBuffer).rotate(); // 自动按 EXIF 旋转

    // 主图 640px
    const mainBuffer = await pipeline
      .clone()
      .resize({ width: MAIN_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: MAIN_QUALITY, mozjpeg: true })
      .toBuffer();

    // 缩略图 240px
    const thumbBuffer = await pipeline
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toBuffer();

    // 存到 Blobs
    const store = getImageStore();
    const mainKey = `${inspirationId}.jpg`;
    const thumbKey = `${inspirationId}.thumb.jpg`;

    await Promise.all([
      store.set(mainKey, mainBuffer, { metadata: { contentType: 'image/jpeg' } }),
      store.set(thumbKey, thumbBuffer, { metadata: { contentType: 'image/jpeg' } }),
    ]);

    console.log(
      `[image] ${inspirationId}: ${(originalSize/1024).toFixed(0)}KB → ` +
      `main=${(mainBuffer.length/1024).toFixed(0)}KB, thumb=${(thumbBuffer.length/1024).toFixed(0)}KB`
    );

    return {
      mainUrl: `/api/image/${inspirationId}`,
      thumbUrl: `/api/image/${inspirationId}?thumb=1`,
      mainSize: mainBuffer.length,
      thumbSize: thumbBuffer.length,
      originalSize,
    };
  } catch (e: any) {
    console.error(`[image] process error for ${inspirationId}:`, e.message);
    return null;
  }
}

/**
 * 给老图生成缩略图（backfill 用）
 * - 输入：inspirationId + 主图 buffer
 * - 只生成 240px 缩略图（主图不动）
 */
export async function generateThumbnailForExisting(
  inspirationId: string,
  mainBuffer: Buffer,
): Promise<{ thumbSize: number } | null> {
  if (!mainBuffer || mainBuffer.length === 0) return null;

  try {
    const thumbBuffer = await sharp(mainBuffer)
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toBuffer();

    const store = getImageStore();
    await store.set(`${inspirationId}.thumb.jpg`, thumbBuffer, {
      metadata: { contentType: 'image/jpeg' },
    });

    console.log(`[image-backfill] ${inspirationId}: thumb=${(thumbBuffer.length/1024).toFixed(0)}KB`);
    return { thumbSize: thumbBuffer.length };
  } catch (e: any) {
    console.error(`[image-backfill] ${inspirationId} error:`, e.message);
    return null;
  }
}

/**
 * 缩略图转 base64（给 Excel 嵌入用）
 * - 失败返回 null
 */
export async function getThumbnailBase64(inspirationId: string): Promise<string | null> {
  try {
    const store = getImageStore();
    const value = await store.get(`${inspirationId}.thumb.jpg`, { type: 'arrayBuffer' });
    if (!value) return null;
    return Buffer.from(value as ArrayBuffer).toString('base64');
  } catch {
    return null;
  }
}
