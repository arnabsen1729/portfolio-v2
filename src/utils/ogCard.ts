import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Light-theme design tokens from global.css — OG cards always render the
// paper variant regardless of the viewer's theme.
const PAPER = '#fbfaf7';
const INK = '#1b1e24';
const INK_SOFT = '#4a4e58';
const OXBLOOD = '#8c2f26';
const HAIRLINE = '#dedad2';
const RING_STROKE = '#b9b4a8';
const SLATE = '#3e5468';

const WIDTH = 1200;
const HEIGHT = 630;

const FONT_DIR = path.join(process.cwd(), 'node_modules', '@fontsource');
const FONTS = [
  { name: 'IBM Plex Serif', weight: 600, file: 'ibm-plex-serif/files/ibm-plex-serif-latin-600-normal.woff' },
  { name: 'IBM Plex Sans', weight: 400, file: 'ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff' },
  { name: 'IBM Plex Mono', weight: 400, file: 'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff' },
  { name: 'IBM Plex Mono', weight: 500, file: 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff' },
] as const;

let fontsPromise: ReturnType<typeof loadFonts> | undefined;

async function loadFonts() {
  return Promise.all(
    FONTS.map(async (f) => ({
      name: f.name,
      weight: f.weight,
      style: 'normal' as const,
      data: await fs.readFile(path.join(FONT_DIR, f.file)),
    })),
  );
}

// Deterministic per-page seed so each card's hash ring is subtly unique.
function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Avalanche finalizer — without it, similar-length slugs land on nearly
  // identical angles when reduced mod 360.
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return h >>> 0;
}

// Static rendering of the site's hash-ring signature (see HashRing.astro),
// with node placement rotated by the page's seed hash. Satori can't lay out
// raw SVG children, so it's embedded as a data-URI image.
function hashRingDataUri(seed: number): string {
  const offset = seed % 360;
  const points = [18, 140, 260].map((deg) => (deg + offset) % 360);
  const keyAngle = (points[0] + 305) % 360;
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
    <circle cx="80" cy="80" r="62" stroke="${RING_STROKE}" stroke-width="1.5"/>
    ${ticks.map((deg) => `<line x1="80" y1="14" x2="80" y2="20" stroke="${RING_STROKE}" stroke-width="1.5" transform="rotate(${deg} 80 80)"/>`).join('')}
    ${points.map((deg, i) => `<circle cx="80" cy="18" r="${i === 0 ? 5.5 : 4}" fill="${OXBLOOD}" transform="rotate(${deg} 80 80)"/>`).join('')}
    <circle cx="80" cy="18" r="3" fill="${SLATE}" transform="rotate(${keyAngle} 80 80)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Faint dot-grid texture. Satori accepts radial-gradient backgrounds but the
// tiled output doesn't survive resvg, so the grid is a real SVG <pattern>.
function dotGridDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs><pattern id="d" width="36" height="36" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.75" fill="${HAIRLINE}"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#d)"/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function titleSize(title: string): number {
  if (title.length > 80) return 54;
  if (title.length > 50) return 62;
  return 72;
}

// Satori accepts React-element-shaped plain objects; this avoids a JSX/React
// dependency for a single template. A childless element must pass
// `children: undefined`, not `[]` — satori miscounts an empty array as
// multiple children.
function el(type: string, props: Record<string, unknown>, ...children: unknown[]) {
  const normalized = children.length === 0 ? undefined : children.length === 1 ? children[0] : children;
  return { type, props: { ...props, children: normalized } };
}

export interface OgCardProps {
  /** Mono identity label, top-left (e.g. "ARNAB SEN · WRITING"). */
  eyebrowLeft: string;
  /** Mono metadata label, top-right (e.g. "JAN 31, 2022 · 16 MIN"). */
  eyebrowRight: string;
  title: string;
  dek: string;
  /** Rendered as mono pills in the footer; only the first 3 are shown. */
  tags: string[];
  /** Any stable string (slug, page id) — sets the hash ring's rotation. */
  seed: string;
}

function card(props: OgCardProps) {
  const mono = (text: string, extra: Record<string, unknown> = {}) =>
    el('div', {
      style: {
        fontFamily: 'IBM Plex Mono',
        fontSize: 22,
        letterSpacing: '0.08em',
        color: INK_SOFT,
        textTransform: 'uppercase',
        ...extra,
      },
    }, text);

  return el(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: PAPER,
        padding: '64px 72px',
        position: 'relative',
      },
    },
    el('img', {
      src: dotGridDataUri(),
      width: WIDTH,
      height: HEIGHT,
      style: { position: 'absolute', top: 0, left: 0 },
    }),
    // Eyebrow row: identity left, metadata right
    el(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', width: '100%' } },
      mono(props.eyebrowLeft, { fontWeight: 500, color: INK }),
      mono(props.eyebrowRight),
    ),
    // Title + rule + dek
    el(
      'div',
      { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', paddingRight: 60 } },
      el('div', {
        style: {
          fontFamily: 'IBM Plex Serif',
          fontWeight: 600,
          fontSize: titleSize(props.title),
          lineHeight: 1.15,
          color: INK,
          display: 'block',
          lineClamp: 3,
        },
      }, props.title),
      el('div', { style: { width: 96, height: 5, backgroundColor: OXBLOOD, marginTop: 28, marginBottom: 28 } }),
      props.dek
        ? el('div', {
            style: {
              fontFamily: 'IBM Plex Sans',
              fontSize: 31,
              lineHeight: 1.45,
              color: INK_SOFT,
              display: 'block',
              lineClamp: 2,
            },
          }, props.dek)
        : el('div', { style: { display: 'flex' } }),
    ),
    // Footer: tag pills left, hash-ring signature right
    el(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' } },
      el(
        'div',
        { style: { display: 'flex', gap: 14 } },
        ...props.tags.slice(0, 3).map((tag) =>
          el('div', {
            style: {
              fontFamily: 'IBM Plex Mono',
              fontSize: 21,
              color: INK_SOFT,
              border: `1.5px solid ${HAIRLINE}`,
              borderRadius: 999,
              padding: '8px 22px',
              backgroundColor: PAPER,
            },
          }, tag),
        ),
      ),
      el('img', { src: hashRingDataUri(hashSlug(props.seed)), width: 130, height: 130 }),
    ),
  );
}

export async function renderOgCard(props: OgCardProps): Promise<Uint8Array<ArrayBuffer>> {
  fontsPromise ??= loadFonts();
  const svg = await satori(card(props) as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: await fontsPromise,
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  return new Uint8Array(png);
}
