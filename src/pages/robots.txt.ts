import type { APIRoute } from 'astro';

// Astro.site is the bare origin (no base path) — build the sitemap URL the
// same way BaseLayout builds canonical/OG URLs, off BASE_URL, so this stays
// correct both under the /portfolio-v2/ prototyping base and a future
// custom-domain base of `/`. Note: under the prototyping base this file is
// only served at /portfolio-v2/robots.txt, not the true domain root, so
// crawlers won't discover it there until the custom domain goes live (see
// CUSTOM_DOMAIN in astro.config.mjs) — a pre-existing limitation of GitHub
// Pages project sites, not specific to this route.
export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
