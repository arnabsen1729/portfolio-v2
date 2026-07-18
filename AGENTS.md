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
- **OG image route file must be named `[...slug].ts`, not
  `[...slug].png.ts`.** `astro-og-canvas`'s default `getSlug` already
  appends `.png` to the pages-object key; combining that with a `.png` in
  the route filename produces a double `.png.png` extension.
- **`canvaskit-wasm` must stay a direct `dependency`** in package.json, not
  just a transitive dep of `astro-og-canvas`. pnpm's strict `node_modules`
  layout doesn't hoist it automatically, and the OG route throws
  `__dirname is not defined` / a canvaskit-wasm install error at build time
  without it.
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
- `numberedSections: true` in frontmatter is the opt-in for oxblood numbered
  `##` headings — default is off, keep it that way (only genuinely
  sequential posts should number their sections).
- The oxblood/serif design system intentionally extends to résumé and
  papershelf, not just blog posts — don't fork a "simpler" style for those
  pages.
- Résumé is both an HTML page (`src/pages/resume.astro`) and a PDF link
  (`public/resume.pdf`) — keep both in sync if editing one.

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
