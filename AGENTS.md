# AGENTS.md

Guidance for AI coding agents working in this repo. See `README.md` for
user-facing docs (commands, content authoring).

## What this is

A personal blog/portfolio (arnabsen.dev), rebuilt off Hashnode as a
self-owned Astro static site. ~25 posts still need migrating from Hashnode —
that's a deliberately separate, later phase (see "Deferred work" below); the
current codebase only has placeholder sample content.

## Commands

```bash
pnpm dev              # dev server (no search — pagefind only runs on build)
pnpm build            # astro build && pagefind --site dist
npx astro check       # typecheck .astro files
pnpm preview           # serve dist/ locally to sanity-check a build
```

Always run `astro build` (not just `astro check`) before considering a
content-layer or routing change done — several bugs here only surfaced at
build time (see "Non-obvious constraints" below).

## Non-obvious constraints (read before touching these areas)

- **`.page-grid > .content` must NOT be capped at `--measure` (62ch).**
  Sidenotes are floated with a negative right-margin computed against this
  box's actual width to land in the `.rail` column. Constraining it to 62ch
  misaligns the float. If you want narrower prose, add padding-right inside
  `.post-content`, don't shrink `.content` itself. (`.prose-only` class
  exists for pages that never use sidenotes.)
- **Sidenote numbering is pure CSS** (`counter-increment` on
  `.sidenote-wrapper`, read via `counter()` in both the ref and the note) —
  no JS state. Don't add a JS-based counter; Astro component frontmatter
  can behave like a shared module scope for build-time state and would
  produce wrong/duplicate counts across pages built in the same process.
- **Sidenote mobile behavior** uses a hidden checkbox + `<label>` (the Tufte
  CSS pattern), not `<details>` — this keeps a single copy of the slotted
  content in the DOM instead of duplicating it for a desktop vs. mobile
  variant.
- **Pagefind UI must be loaded via a `<script>` tag with `.src` set**, not
  a dynamic `import()`. Vite/Rollup resolves literal dynamic-import string
  paths at build time regardless of `/* @vite-ignore */`, and
  `/pagefind/pagefind-ui.js` doesn't exist until *after* `astro build` runs
  (pagefind is a separate post-build CLI step). See `SearchModal.astro`.
- **Search does not work under `pnpm dev`, by design — this is not a bug to
  "fix" by making it work in dev.** `pnpm dev` serves straight from source
  and never runs the `pagefind` CLI, so `dist/pagefind/` (and therefore
  `/pagefind/pagefind-ui.js` / `pagefind-ui.css`) simply doesn't exist yet.
  To test search, always run `pnpm build && pnpm preview` (which serves the
  real `dist/`), not `pnpm dev`. If asked to debug "search doesn't work,"
  check which command the user ran before touching `SearchModal.astro`.
  Known gap: this failure is currently **silent** — `loadPagefind()`'s
  promise rejects on the 404 but `openDialog()` doesn't `.catch()` it, so
  the dialog just opens empty with no message. A pending fix (blocked on
  Bash/write access at the time this was written) is to show a fallback
  message like "Search isn't available in dev — run a production build" in
  that catch branch instead of swallowing the rejection.
- **OG images are hand-rendered with `satori` + `@resvg/resvg-js`** in
  `src/pages/og/[...slug].png.ts` (no longer `astro-og-canvas`/
  `canvaskit-wasm` — those were removed). The route file is named
  `[...slug].png.ts` on purpose here since `getStaticPaths` params don't
  include the extension, unlike the old library's auto-appended `.png`.
- **Satori's div layout is strict flexbox-in-name-only**: any element with
  more than one child needs an explicit `display` (`flex`/`contents`/`none`)
  or satori throws at render time, and a `children` array of length 0 must
  be `undefined`, not `[]`. Also, tiled CSS `radial-gradient` backgrounds
  (used for the dot-grid texture) don't survive the SVG → PNG resvg step —
  render textures as a real SVG `<pattern>` data-URI `<img>` instead.
- The hash-ring corner motif on each OG card is a static SVG re-derived from
  `HashRing.astro`'s geometry (satori can't lay out arbitrary SVG children
  directly, so it's inlined as a data-URI image), rotated per-post via an
  FNV-1a hash of the slug. The hash needs an avalanche finalizer (xor/mul/xor
  shift) after the FNV loop — without it, similarly-shaped slugs land within
  a few degrees of each other after `% 360`.
- **TypeScript is pinned to `^5.x`.** `@astrojs/check` / `tsconfck` /
  `zod-to-ts` don't yet support TS 7; `pnpm add -D typescript` alone will
  grab the latest major and break `astro check`.
- Content collections use the **Content Layer API** (`loader: glob(...)` in
  `src/content/config.ts`), not the legacy `type: 'content'` syntax. Use
  `entry.id` (not `entry.slug`) when referencing a collection entry's route
  segment.

## Content authoring conventions

- Sidenotes are enabled globally, not opt-in — any post can use
  `<Sidenote>` without a frontmatter flag (this was an explicit decision,
  don't add a gating flag back in).
- **Callout blockquotes**: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`,
  `> [!WARNING]`, `> [!CAUTION]` as the first line of a `>` blockquote render
  as a color-coded callout with an icon + label (GitHub's alert syntax, no
  import needed — works in every post automatically). Implemented as a
  remark plugin, `remarkCallouts` in `astro.config.mjs`, which rewrites the
  blockquote's mdast node into a `<div class="callout callout-<slug>">` via
  `hName`/`hProperties`/`hChildren` before it reaches rehype. Icons are
  inlined Lucide-style SVG path data (matching `Icon.astro`'s visual style)
  duplicated in the plugin rather than imported, since `Icon.astro` is an
  Astro component and this transform runs in mdast/hast space. A plain `>`
  blockquote with no marker still renders — just as a quieter, undecorated
  quote (see `.post-content blockquote` in `global.css`), not a callout.
- `numberedSections: true` in frontmatter is the opt-in for oxblood numbered
  `##` headings — default is off, keep it that way (only genuinely
  sequential posts should number their sections).
- The oxblood/serif design system intentionally extends to résumé and
  papershelf, not just blog posts — don't fork a "simpler" style for those
  pages.
- Résumé is both an HTML page (`src/pages/resume.astro`) and a PDF link
  (`public/resume.pdf`) — keep both in sync if editing one.

## SEO & performance conventions for new posts/pages

Most of this is automatic — don't hand-roll what the layouts already do.
Read this before adding a post or page, not after something looks wrong in
search results.

- **Never write `# Heading` (h1) inside a post's markdown body.** The page's
  only `<h1>` is the post title, rendered once by `PostLayout.astro`. Start
  post sections at `##` (h2) and nest from there. Every page in the built
  site is expected to have exactly one `<h1>` — verify with
  `grep -o '<h1' dist/**/index.html | wc -l` per page after `pnpm build` if
  you're touching heading structure. (This bit six existing posts before it
  was caught — see git history around "SEO fixes: single h1 per post".)
- **Watch for `#`-prefixed lines inside fenced code blocks** when scanning
  markdown for heading issues — shell/Python comments (`# like this`) match
  a naive `^# ` heading regex but aren't real headings. Track fence state
  (toggle on ` ``` `) before treating a `#` line as a heading to fix.
- **Always write a real `dek` in frontmatter** (used as the meta
  description, OG/Twitter description, and `BlogPosting` JSON-LD
  description). One generic sentence ("About Arnab Sen.") is a known SEO
  smell — aim for a genuine 1–2 sentence summary of the post, roughly
  120–160 characters.
- **Don't hand-add OG images, JSON-LD, canonical URLs, or robots/sitemap
  entries for new posts** — they're generated automatically:
  - OG card: `src/pages/og/[...slug].png.ts` renders one per post id from
    title/dek/tags/date via `src/utils/ogCard.ts` (satori + resvg). The ids
    `home`, `about`, `resume` are reserved for page-level cards — don't slug
    a post with one of those names.
  - `BlogPosting` JSON-LD is emitted by `PostLayout.astro` via
    `JsonLd.astro`, using the same title/dek/date/tags — no per-post setup.
  - `sitemap-index.xml` (via `@astrojs/sitemap`) and `robots.txt` (via
    `src/pages/robots.txt.ts`) pick up new routes automatically at build
    time.
  - If you add a new top-level *page* (not a post) that should be
    discoverable/shareable, give it an explicit `ogImage` prop on
    `BaseLayout` (see `about.astro`/`resume.astro` for the pattern) rather
    than letting it fall through to the generic `/og/home.png` fallback.
- **Post-body images get `loading`/`decoding`/`width`/`height` injected
  automatically** by the `rehypeOptimizeImages` plugin in
  `astro.config.mjs` — don't add these attributes by hand in markdown (you
  can't anyway; markdown image syntax has no attribute slots). This only
  computes `width`/`height` for images already downloaded into
  `public/images/blog/...` via `scripts/download-blog-images.mjs` — a
  hotlinked image never localized only gets the loading/decoding hints, no
  dimensions. If a post's `<img>` is missing width/height in the built
  output, localize the image rather than adding a manual fix.
- **Write meaningful alt text on every image** — the migration/download
  pipeline doesn't infer it, so several legacy posts have empty `alt`
  attributes. New content should never ship an image without one.
- **Don't add `astro-og-canvas`/`canvaskit-wasm` back** or a Google
  Fonts `<link>` — OG images and fonts are both self-hosted by design (see
  "Non-obvious constraints" above); reintroducing either regresses a
  previously-fixed performance/dependency issue.

## Deferred work (don't build unless asked)

- **Hashnode migration**: export, frontmatter mapping, image re-hosting,
  redirects. Out of scope until explicitly requested — do not attempt to
  script this speculatively.
- **Giscus comments**: deferred until the GitHub repo/Discussions setup is
  confirmed as public. Don't wire up giscus without checking first.

## Known placeholders to flag, not silently "fix"

- `public/resume.pdf` does not exist — the résumé page's download link will
  404 until a real PDF is added.
- `src/pages/resume.astro` experience/education content, and the GitHub
  links in `Footer.astro`/`about.astro`, are placeholder text — don't treat
  them as real content to build on top of.
