import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import sharp from 'sharp';

// Set to the custom domain (e.g. 'arnabsen.dev') once DNS + the GitHub Pages
// custom domain are configured. Leave as `null` to deploy at
// https://arnabsen1729.github.io/portfolio-v2 for prototyping.
const CUSTOM_DOMAIN = null;

const site = CUSTOM_DOMAIN
  ? `https://${CUSTOM_DOMAIN}`
  : 'https://arnabsen1729.github.io';
const base = CUSTOM_DOMAIN ? '/' : '/portfolio-v2/';

// Blog posts reference local images (downloaded by scripts/download-blog-images.mjs)
// with root-relative paths like /images/blog/<slug>/cover.png, written without
// knowledge of the deploy base path. This rewrites them to `${base}images/...`
// at build time so they resolve correctly under both the /portfolio-v2/
// prototyping base and a future custom-domain base of `/`.
function remarkBaseUrlImages() {
  return (tree) => {
    visit(tree, 'image', (node) => {
      if (node.url.startsWith('/images/')) {
        node.url = base + node.url.slice(1);
      }
    });
  };
}

// Post-body <img> tags come straight from markdown with no width/height
// (CLS risk) or loading/decoding hints (every image eager-loads regardless
// of position). For images downloaded locally by download-blog-images.mjs,
// reads intrinsic dimensions with sharp (already a dependency) so the
// browser can reserve layout space before the image arrives. Hotlinked
// images that were never localized just get the loading/decoding hints.
const dimensionCache = new Map();

async function intrinsicSize(filePath) {
  if (dimensionCache.has(filePath)) return dimensionCache.get(filePath);
  const promise = readFile(filePath)
    .then((buf) => sharp(buf).metadata())
    .then((meta) => (meta.width && meta.height ? { width: meta.width, height: meta.height } : null))
    .catch(() => null);
  dimensionCache.set(filePath, promise);
  return promise;
}

function rehypeOptimizeImages() {
  return async (tree) => {
    const images = [];
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img') images.push(node);
    });

    await Promise.all(
      images.map(async (node) => {
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';

        const src = node.properties.src;
        const marker = 'images/blog/';
        const markerIndex = typeof src === 'string' ? src.indexOf(marker) : -1;
        if (markerIndex === -1) return;

        const filePath = path.join(process.cwd(), 'public', src.slice(markerIndex));
        const size = await intrinsicSize(filePath);
        if (size) {
          node.properties.width = size.width;
          node.properties.height = size.height;
        }
      }),
    );
  };
}

// Writes a CNAME file to the build output only when a custom domain is set,
// so prototyping builds don't accidentally register a custom domain in Pages.
function cnameIntegration() {
  return {
    name: 'cname',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        if (!CUSTOM_DOMAIN) return;
        const { writeFile } = await import('node:fs/promises');
        const { fileURLToPath } = await import('node:url');
        await writeFile(fileURLToPath(new URL('CNAME', dir)), CUSTOM_DOMAIN);
      },
    },
  };
}

export default defineConfig({
  site,
  base,
  integrations: [mdx(), sitemap(), cnameIntegration()],
  markdown: {
    remarkPlugins: [remarkMath, remarkBaseUrlImages],
    rehypePlugins: [rehypeKatex, rehypeOptimizeImages],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      // Dual themes default to a `prefers-color-scheme` media query, which
      // ignores this site's manual `html.dark` class toggle. Disabling the
      // default color lets global.css switch the --shiki-* vars off the
      // class instead (see "Code blocks" in global.css).
      defaultColor: false,
    },
  },
});
