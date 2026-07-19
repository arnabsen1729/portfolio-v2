#!/usr/bin/env node
// One-off migration of the "This Week in AI & Tech" Substack newsletter into
// src/content/blog/*.mdx. Reads the raw post HTML from a Substack data export
// (substack/<export-id>/posts/*.html + posts.csv) and converts it to MDX,
// stripping Substack-specific chrome (subscribe CTAs, embeds) along the way.
//
// Usage: node scripts/migrate-substack.mjs

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EXPORT_DIR = path.resolve('substack/8xFxSONwSaWa_GP0vacQsQ');
const POSTS_DIR = path.join(EXPORT_DIR, 'posts');
const BLOG_DIR = path.resolve('src/content/blog');

const POSTS = [
  {
    id: '195413722.week-in-ai-01',
    slug: 'ep-01-gpt-deepseek-ai-layoff-trap',
    title: 'This Week in AI & Tech - Ep 01',
    dek: 'GPT, DeepSeek and AI Layoff Trap',
    date: '2026-04-25',
  },
  {
    id: '196190559.week-in-ai-02',
    slug: 'ep-02-continual-learning',
    title: 'This Week in AI & Tech - Ep 02',
    dek: 'Quest for Continual Learning and one elephant',
    date: '2026-05-03',
  },
  {
    id: '197017475.week-in-ai-03',
    slug: 'ep-03-is-your-llm-lying',
    title: 'This Week in AI & Tech - Ep 03',
    dek: 'How to tell if your LLM is lying to you.',
    date: '2026-05-10',
  },
  {
    id: '198937594.week-in-ai-04',
    slug: 'ep-04-one-step-to-agi',
    title: 'This Week in AI & Tech - Ep 04',
    dek: 'One step to AGI',
    date: '2026-05-24',
  },
  {
    id: '199949331.week-in-ai-05',
    slug: 'ep-05-opus-4-8-dynamic-workflows',
    title: 'This Week in AI & Tech - Ep 05',
    dek: 'Breaking down Opus 4.8, Dynamic Workflows, and Constitutional AI.',
    date: '2026-05-31',
  },
];

const BOILERPLATE_RE =
  /<p>Every week, I spend a significant chunk of my time reading through various tech blogs, documentation, and industry updates to keep my own knowledge fresh\. I started this newsletter as a simple way to organize those thoughts and share the things I found genuinely interesting or useful\.<\/p>/;

function decodeEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractDataAttrs(tag) {
  const m = tag.match(/data-attrs="([^"]*)"/);
  if (!m) return null;
  try {
    return JSON.parse(decodeEntities(m[1]));
  } catch {
    return null;
  }
}

function classOf(tag) {
  const m = tag.match(/class="([^"]*)"/);
  return m ? m[1] : '';
}

// Finds every balanced <tagName>...</tagName> pair in html, including nested
// ones. `depth` on each result is relative to this call's scope, so filtering
// depth === 0 gives only the immediate (non-nested) matches.
function matchBalancedTag(html, tagName) {
  const tokenRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>|<\\/${tagName}>`, 'g');
  const stack = [];
  const results = [];
  let depth = 0;
  let m;
  while ((m = tokenRe.exec(html))) {
    const isOpen = !m[0].startsWith('</');
    if (isOpen) {
      stack.push({ start: m.index, openTag: m[0], depthAtOpen: depth });
      depth++;
    } else {
      depth--;
      const opened = stack.pop();
      if (!opened) continue;
      results.push({
        start: opened.start,
        end: m.index + m[0].length,
        openTag: opened.openTag,
        inner: html.slice(opened.start + opened.openTag.length, m.index),
        depth: opened.depthAtOpen,
      });
    }
  }
  return results;
}

function stripChrome(html) {
  let out = html;
  out = out.replace(/<p class="button-wrapper"[\s\S]*?<\/p>/g, '');
  out = out.replace(BOILERPLATE_RE, '');
  return out;
}

function transformImageDiv(fullHtml) {
  const imgMatch = fullHtml.match(/<img src="(https:\/\/substack-post-media[^"]+)"/);
  if (!imgMatch) return '';
  const src = imgMatch[1];
  const capMatch = fullHtml.match(/<figcaption class="image-caption">([\s\S]*?)<\/figcaption>/);
  let caption = '';
  if (capMatch) {
    const linkMatch = capMatch[1].match(/<a[^>]*>([\s\S]*?)<\/a>/);
    caption = decodeEntities((linkMatch ? linkMatch[1] : capMatch[1]).trim());
  }
  return `\n\n![${caption}](${src})\n\n`;
}

function replaceDivs(html) {
  const blocks = matchBalancedTag(html, 'div').filter((b) => b.depth === 0);
  let out = '';
  let cursor = 0;
  for (const block of blocks) {
    out += html.slice(cursor, block.start);
    const cls = classOf(block.openTag);
    const fullHtml = block.openTag + block.inner + '</div>';

    if (cls.includes('captioned-image-container')) {
      out += transformImageDiv(fullHtml);
    } else if (cls.includes('twitter-embed')) {
      const attrs = extractDataAttrs(block.openTag);
      if (attrs) {
        const text = (attrs.full_text || '').trim().replace(/\s*\n+\s*/g, ' ');
        out += `\n\n> ${decodeEntities(text)} — [@${attrs.username} on X](${attrs.url})\n\n`;
      }
    } else if (cls.includes('youtube-wrap')) {
      const attrs = extractDataAttrs(block.openTag);
      if (attrs?.videoId) out += `\n\n[Watch on YouTube](https://youtu.be/${attrs.videoId})\n\n`;
    } else if (cls.includes('datawrapper-wrap')) {
      const attrs = extractDataAttrs(block.openTag);
      if (attrs?.url) out += `\n\n[View interactive chart](${attrs.url})\n\n`;
    } else if (cls.includes('subscription-widget-wrap-editor')) {
      // drop — Substack subscribe CTA, not post content
    } else if (block.inner.trim() === '<hr>') {
      out += '\n\n---\n\n';
    } else {
      // unrecognized wrapper div — keep its inner content for later passes
      out += block.inner;
    }
    cursor = block.end;
  }
  out += html.slice(cursor);
  return out;
}

function replaceInline(html) {
  let out = html;
  out = out.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)');
  out = out.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
  out = out.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  out = out.replace(/<code>([\s\S]*?)<\/code>/g, '`$1`');
  return out;
}

function cleanListItemText(text) {
  return decodeEntities(text.replace(/<\/?p>/g, '').trim()).replace(/\s+/g, ' ');
}

function renderList(listInner, indent, ordered) {
  const liBlocks = matchBalancedTag(listInner, 'li').filter((b) => b.depth === 0);
  const lines = [];
  liBlocks.forEach((li, i) => {
    const nestedLists = [
      ...matchBalancedTag(li.inner, 'ul').filter((b) => b.depth === 0).map((b) => ({ ...b, ordered: false })),
      ...matchBalancedTag(li.inner, 'ol').filter((b) => b.depth === 0).map((b) => ({ ...b, ordered: true })),
    ].sort((a, b) => a.start - b.start);
    let textOnly = li.inner;
    for (const nested of [...nestedLists].reverse()) {
      textOnly = textOnly.slice(0, nested.start) + textOnly.slice(nested.end);
    }
    const text = cleanListItemText(textOnly);
    const prefix = '  '.repeat(indent) + (ordered ? `${i + 1}. ` : '- ');
    if (text) lines.push(prefix + text);
    for (const nested of nestedLists) {
      lines.push(renderList(nested.inner, indent + 1, nested.ordered));
    }
  });
  return lines.join('\n');
}

function replaceLists(html) {
  const ulBlocks = matchBalancedTag(html, 'ul').filter((b) => b.depth === 0).map((b) => ({ ...b, ordered: false }));
  const olBlocks = matchBalancedTag(html, 'ol').filter((b) => b.depth === 0).map((b) => ({ ...b, ordered: true }));
  const blocks = [...ulBlocks, ...olBlocks].sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const block of blocks) {
    out += html.slice(cursor, block.start);
    out += '\n\n' + renderList(block.inner, 0, block.ordered) + '\n\n';
    cursor = block.end;
  }
  out += html.slice(cursor);
  return out;
}

function replaceCodeBlocks(html) {
  return html.replace(
    /<pre class="shiki"><code class="language-([a-z]*)">([\s\S]*?)<\/code><\/pre>/g,
    (_, lang, code) => `\n\n\`\`\`${lang === 'plaintext' ? '' : lang}\n${decodeEntities(code)}\n\`\`\`\n\n`,
  );
}

function replaceBlockquotes(html) {
  return html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (_, inner) => {
    const text = inner.replace(/<\/?p>/g, '').trim();
    return `\n\n> ${decodeEntities(text)}\n\n`;
  });
}

function replaceHeadingsAndParagraphs(html) {
  let out = html;
  // Demote h1 — the page template renders the post title as the single h1.
  out = out.replace(/<h1>([\s\S]*?)<\/h1>/g, '\n\n## $1\n\n');
  out = out.replace(/<h2>([\s\S]*?)<\/h2>/g, '\n\n## $1\n\n');
  out = out.replace(/<h3>([\s\S]*?)<\/h3>/g, '\n\n### $1\n\n');
  out = out.replace(/<p>([\s\S]*?)<\/p>/g, '\n\n$1\n\n');
  return out;
}

function htmlToMarkdown(html) {
  let md = html;
  md = replaceDivs(md);
  md = replaceCodeBlocks(md);
  md = replaceInline(md);
  md = replaceLists(md);
  md = replaceBlockquotes(md);
  md = replaceHeadingsAndParagraphs(md);
  md = decodeEntities(md);
  md = md.replace(/[ \t]+\n/g, '\n');
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();
  return md;
}

async function migratePost({ id, slug, title, dek, date }) {
  const htmlPath = path.join(POSTS_DIR, `${id}.html`);
  const raw = await readFile(htmlPath, 'utf-8');

  const cleaned = stripChrome(raw);
  const body = htmlToMarkdown(cleaned);

  const frontmatter = [
    '---',
    `title: '${title.replace(/'/g, "''")}'`,
    `dek: '${dek.replace(/'/g, "''")}'`,
    `date: ${date}`,
    `tags: ['ai', 'llm']`,
    '---',
    '',
  ].join('\n');

  const outPath = path.join(BLOG_DIR, `${slug}.mdx`);
  await writeFile(outPath, frontmatter + '\n' + body + '\n');
  console.log(`Wrote ${outPath}`);
}

async function main() {
  for (const post of POSTS) {
    await migratePost(post);
  }
}

main();
