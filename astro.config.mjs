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
const CUSTOM_DOMAIN = 'arnabsen.dev';

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

// GitHub-style alert blockquotes: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`,
// `> [!WARNING]`, `> [!CAUTION]` as the first line of a blockquote render as
// a color-coded callout with an icon + label instead of a plain quote. Kept
// as a remark plugin (mdast, not rehype) so it can inspect the raw marker
// text before it's split across inline nodes.
const CALLOUTS = {
  NOTE: { label: 'Note', slug: 'note', icon: 'info' },
  TIP: { label: 'Tip', slug: 'tip', icon: 'lightbulb' },
  IMPORTANT: { label: 'Important', slug: 'important', icon: 'alert-circle' },
  WARNING: { label: 'Warning', slug: 'warning', icon: 'alert-triangle' },
  CAUTION: { label: 'Caution', slug: 'caution', icon: 'octagon-alert' },
};

const CALLOUT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/;

// Lucide-style stroke icon path data, matching the visual style already
// used by Icon.astro (24x24 viewbox, stroke-width 2, round caps/joins) —
// inlined here rather than reused from Icon.astro since that's an Astro
// component and this runs in the mdast/hast transform, not component space.
const ICON_PATHS = {
  info: [
    { tag: 'circle', props: { cx: '12', cy: '12', r: '10' } },
    { tag: 'path', props: { d: 'M12 16v-4' } },
    { tag: 'path', props: { d: 'M12 8h.01' } },
  ],
  lightbulb: [
    {
      tag: 'path',
      props: {
        d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
      },
    },
    { tag: 'path', props: { d: 'M9 18h6' } },
    { tag: 'path', props: { d: 'M10 22h4' } },
  ],
  'alert-circle': [
    { tag: 'circle', props: { cx: '12', cy: '12', r: '10' } },
    { tag: 'path', props: { d: 'M12 8v4' } },
    { tag: 'path', props: { d: 'M12 16h.01' } },
  ],
  'alert-triangle': [
    {
      tag: 'path',
      props: { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z' },
    },
    { tag: 'path', props: { d: 'M12 9v4' } },
    { tag: 'path', props: { d: 'M12 17h.01' } },
  ],
  'octagon-alert': [
    { tag: 'path', props: { d: 'M12 8v4' } },
    { tag: 'path', props: { d: 'M12 16h.01' } },
    {
      tag: 'path',
      props: {
        d: 'M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2Z',
      },
    },
  ],
};

function calloutIconHast(icon) {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      viewBox: '0 0 24 24',
      width: 18,
      height: 18,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
      className: ['callout-icon'],
    },
    children: ICON_PATHS[icon].map(({ tag, props }) => ({
      type: 'element',
      tagName: tag,
      properties: props,
      children: [],
    })),
  };
}

function remarkCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node) => {
      const firstParagraph = node.children[0];
      if (!firstParagraph || firstParagraph.type !== 'paragraph') return;
      const firstText = firstParagraph.children[0];
      if (!firstText || firstText.type !== 'text') return;

      const match = firstText.value.match(CALLOUT_MARKER);
      if (!match) return;
      const callout = CALLOUTS[match[1]];

      firstText.value = firstText.value.slice(match[0].length);
      if (firstText.value === '') firstParagraph.children.shift();
      if (firstParagraph.children.length === 0) node.children.shift();

      node.data ??= {};
      node.data.hName = 'div';
      node.data.hProperties = { className: ['callout', `callout-${callout.slug}`] };

      node.children.unshift({
        type: 'paragraph',
        children: [],
        data: {
          hName: 'p',
          hProperties: { className: ['callout-title'] },
          hChildren: [calloutIconHast(callout.icon), { type: 'text', value: callout.label }],
        },
      });
    });
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
    remarkPlugins: [remarkMath, remarkBaseUrlImages, remarkCallouts],
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
