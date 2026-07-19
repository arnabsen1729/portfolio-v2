# arnabsen.dev

Personal blog and portfolio — a self-owned, markdown-based static site,
built with [Astro](https://astro.build).

## Stack

- **Framework**: Astro (Content Layer API, static output)
- **Content**: Markdown / MDX in `src/content/blog/` and `src/content/papershelf/`
- **Search**: [Pagefind](https://pagefind.app) (static, generated at build time)
- **Math**: remark-math + rehype-katex
- **Code highlighting**: Shiki (light/dark themes)
- **OG images**: auto-generated per post via `astro-og-canvas`
- **RSS**: `@astrojs/rss`
- **Deployment**: GitHub Actions → GitHub Pages, custom domain via `CNAME`
- **Package manager**: pnpm

## Development

```bash
pnpm install
pnpm dev          # dev server at localhost:4321
pnpm build        # production build + pagefind indexing (dist/)
pnpm preview      # serve the built dist/ locally
```

## Writing a post

Add a `.md` or `.mdx` file under `src/content/blog/`:

```md
---
title: 'Post Title'
dek: 'One-line subtitle, used on cards and the post header.'
date: 2026-07-17
tags: ['distributed-systems']
draft: false
numberedSections: false # opt-in: numbers h2 headings in oxblood
---

Post body in markdown. Use `<Sidenote>` (MDX only) for margin notes:

import Sidenote from '@/components/Sidenote.astro';

Some claim<Sidenote>the supporting detail, in the margin.</Sidenote> here.
```

Reading time is computed from word count automatically; override with
`readingTimeOverride: <minutes>` in frontmatter if needed.

## Adding a paper to Papershelf

Add a `.md` file under `src/content/papershelf/`:

```md
---
title: 'Paper Title'
authors: ['Author One', 'Author Two']
year: 2024
link: 'https://example.com/paper.pdf'
tags: ['distributed-systems']
tldr: 'One or two sentence summary.'
---
```

## Project structure

```
src/
├── content/
│   ├── config.ts          # collection schemas (blog, papershelf)
│   ├── blog/
│   └── papershelf/
├── components/             # Header, Footer, PostCard, TagPill, Sidenote, etc.
├── layouts/                 # BaseLayout, PostLayout
├── pages/                   # routes, incl. blog/[...slug], tags/[tag], rss.xml
├── styles/global.css        # design tokens, typography, layout
└── utils/                    # readingTime, ogCard (satori OG card renderer)
public/
├── CNAME                    # arnabsen.dev
└── resume.pdf               # ⚠️ not committed — add your own
```

## Known placeholders

- `public/resume.pdf` doesn't exist yet — the résumé page links to it but the
  file needs to be added.
- `src/pages/resume.astro` and the About/Footer GitHub links use placeholder
  content — replace with real experience/education and your GitHub handle.
- Hashnode content migration and giscus comments are deferred to a later pass
  (see `AGENTS.md` for context).

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site (including the Pagefind index) and publishes `dist/` to GitHub Pages.
Requires GitHub Pages to be configured for the "GitHub Actions" source in
repo settings.
