#!/usr/bin/env node
// Downloads every externally-hosted image referenced in src/content/blog/*.{md,mdx}
// into public/images/blog/<slug>/, then rewrites the markdown to point at the
// local copy. Run once per batch of newly migrated/edited posts:
//   node scripts/download-blog-images.mjs

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const BLOG_DIR = path.resolve('src/content/blog');
const IMAGES_DIR = path.resolve('public/images/blog');

const IMAGE_MD_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function extFromUrl(url) {
  const last = url.split('/').pop().split('?')[0].split('#')[0];
  const ext = path.extname(last);
  return /^\.[a-z0-9]{2,4}$/i.test(ext) ? ext.toLowerCase() : null;
}

function baseNameFromUrl(url, index) {
  const last = url.split('/').pop().split('?')[0].split('#')[0];
  const stem = last.replace(/\.[a-z0-9]{2,4}$/i, '');
  const safe = slugify(stem || `image-${index}`);
  return safe || `image-${index}`;
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type')?.split(';')[0].trim();
  return { buf, contentType };
}

async function processFile(filePath) {
  const slug = path.basename(filePath).replace(/\.(md|mdx)$/, '');
  const content = await readFile(filePath, 'utf-8');

  const matches = [...content.matchAll(IMAGE_MD_RE)];
  if (matches.length === 0) return { slug, downloaded: 0, failed: 0 };

  const outDir = path.join(IMAGES_DIR, slug);
  await mkdir(outDir, { recursive: true });

  const urlToLocalPath = new Map();
  let downloaded = 0;
  let failed = 0;
  let index = 0;

  for (const match of matches) {
    const url = match[2];
    if (urlToLocalPath.has(url)) continue;
    index += 1;

    try {
      const { buf, contentType } = await downloadImage(url);
      const ext = extFromUrl(url) ?? EXT_BY_MIME[contentType] ?? '.bin';
      const fileName = `${baseNameFromUrl(url, index)}${ext}`;
      await writeFile(path.join(outDir, fileName), buf);
      urlToLocalPath.set(url, `/images/blog/${slug}/${fileName}`);
      downloaded += 1;
    } catch (err) {
      console.warn(`  ✗ ${url} — ${err.message}`);
      failed += 1;
    }
  }

  if (urlToLocalPath.size > 0) {
    let updated = content;
    for (const [url, localPath] of urlToLocalPath) {
      updated = updated.split(url).join(localPath);
    }
    await writeFile(filePath, updated);
  }

  return { slug, downloaded, failed };
}

async function main() {
  const entries = await readdir(BLOG_DIR);
  const files = entries.filter((f) => /\.(md|mdx)$/.test(f));

  let totalDownloaded = 0;
  let totalFailed = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    console.log(`Processing ${file}...`);
    const { slug, downloaded, failed } = await processFile(filePath);
    if (downloaded > 0 || failed > 0) {
      console.log(`  ${slug}: ${downloaded} downloaded, ${failed} failed`);
    }
    totalDownloaded += downloaded;
    totalFailed += failed;
  }

  console.log(`\nDone. ${totalDownloaded} images downloaded, ${totalFailed} failed.`);
}

main();
