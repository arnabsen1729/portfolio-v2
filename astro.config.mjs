import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Set to the custom domain (e.g. 'arnabsen.dev') once DNS + the GitHub Pages
// custom domain are configured. Leave as `null` to deploy at
// https://arnabsen1729.github.io/portfolio-v2 for prototyping.
const CUSTOM_DOMAIN = null;

const site = CUSTOM_DOMAIN
  ? `https://${CUSTOM_DOMAIN}`
  : 'https://arnabsen1729.github.io';
const base = CUSTOM_DOMAIN ? '/' : '/portfolio-v2/';

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
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },
});
