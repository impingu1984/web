// scripts/generate-og.mjs
// Generates per-post OG images at build time.
// Also generates the default OG image on first run.
// Runs via postbuild npm script.
//
// Output: public/og/{slug}.png (gitignored except default.png)
// Cache: skips generation if output exists AND frontmatter hash unchanged.

import { readdir, readFile, writeFile, mkdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOGS_DIR = join(ROOT, 'src/data/blogs');
const OG_DIR = join(ROOT, 'public/og');
const FONTS_DIR = join(ROOT, 'node_modules');

// Ensure output dir exists
await mkdir(OG_DIR, { recursive: true });

// Load fonts
async function loadFont(path) {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

// Try multiple possible font paths for different @fontsource versions
const frauncesPaths = [
  join(FONTS_DIR, '@fontsource/fraunces/files/fraunces-latin-700-normal.woff'),
  join(FONTS_DIR, '@fontsource/fraunces/files/fraunces-latin-700-italic.woff'),
  join(FONTS_DIR, '@fontsource/fraunces/400.css'),
];
const jetbrainsPaths = [
  join(FONTS_DIR, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
  join(FONTS_DIR, '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff'),
];

// Find available font files
async function findFont(paths) {
  for (const p of paths) {
    if (existsSync(p) && !p.endsWith('.css')) return await loadFont(p);
  }
  return null;
}

const frauncesFont = await findFont(frauncesPaths);
const jetbrainsFont = await findFont(jetbrainsPaths);

const fonts = [];
if (frauncesFont) fonts.push({ name: 'Fraunces', data: frauncesFont, weight: 700, style: 'normal' });
if (jetbrainsFont) fonts.push({ name: 'JetBrains Mono', data: jetbrainsFont, weight: 400, style: 'normal' });

// Fallback fonts if @fontsource files not found
if (fonts.length === 0) {
  console.warn('[og] Warning: Could not load custom fonts. Using system fallbacks.');
}

// Parse MDX frontmatter (simple regex — no full MDX parse needed)
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      const val = rest.join(':').trim().replace(/^["']|["']$/g, '');
      fm[key.trim()] = val;
    }
  }
  return fm;
}

function frontmatterHash(fm) {
  return createHash('sha256')
    .update(JSON.stringify({ title: fm.title, description: fm.description, date: fm.date }))
    .digest('hex')
    .slice(0, 12);
}

function estimateReadingTime(content) {
  const body = content.replace(/^---[\s\S]*?---/, '').trim();
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Generate a single OG image via satori
async function generateImage(layout) {
  const svg = await satori(layout, {
    width: 1200,
    height: 630,
    fonts: fonts.length > 0 ? fonts : [
      { name: 'sans-serif', data: Buffer.alloc(0), weight: 400, style: 'normal' },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  return resvg.render().asPng();
}

// Default OG image layout
function defaultLayout() {
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        background: '#0a0e13',
        display: 'flex',
        alignItems: 'center',
        padding: '0 80px',
      },
      children: [
        // Cyan vertical bar
        {
          type: 'div',
          props: {
            style: {
              width: 4,
              height: 160,
              background: '#00d4ff',
              marginRight: 24,
              flexShrink: 0,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 12 },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: 72, fontWeight: 700, fontFamily: 'Fraunces', color: '#f0f0f0', lineHeight: 1.1 },
                  children: 'Iain Morton',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 28, fontFamily: 'JetBrains Mono', color: '#f0f0f0' },
                  children: 'Head of Engineering · CTO',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 24, fontFamily: 'JetBrains Mono', color: '#888888', marginTop: 8 },
                  children: 'iainmorton.me',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// Per-post OG image layout
function postLayout(title, date, readingTime) {
  // Truncate title to ~80 chars for layout safety
  const displayTitle = title.length > 80 ? title.slice(0, 77) + '…' : title;
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        background: '#0a0e13',
        display: 'flex',
        alignItems: 'center',
        padding: '0 80px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: 4,
              height: 160,
              background: '#00d4ff',
              marginRight: 24,
              flexShrink: 0,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 16, flex: 1 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 56,
                    fontWeight: 700,
                    fontFamily: 'Fraunces',
                    color: '#f0f0f0',
                    lineHeight: 1.15,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  },
                  children: displayTitle,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 22, fontFamily: 'JetBrains Mono', color: '#8899aa' },
                  children: `${date}  ·  ${readingTime} min read`,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 22, fontFamily: 'JetBrains Mono', color: '#f0f0f0', marginTop: 8 },
                  children: 'Iain Morton',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 20, fontFamily: 'JetBrains Mono', color: '#888888' },
                  children: 'iainmorton.me',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// Generate default OG image (only if it doesn't exist)
const defaultPath = join(OG_DIR, 'default.png');
if (!existsSync(defaultPath)) {
  console.log('[og] Generating default.png...');
  try {
    const png = await generateImage(defaultLayout());
    await writeFile(defaultPath, png);
    console.log('[og] default.png generated — please review before committing.');
  } catch (err) {
    console.error('[og] Failed to generate default.png:', err.message);
  }
} else {
  console.log('[og] default.png exists — skipping.');
}

// Process all MDX posts
if (!existsSync(BLOGS_DIR)) {
  console.log('[og] No blogs directory found — skipping per-post generation.');
  process.exit(0);
}

const files = (await readdir(BLOGS_DIR)).filter(f => f.endsWith('.mdx'));
console.log(`[og] Processing ${files.length} post(s)...`);

for (const file of files) {
  const slug = basename(file, '.mdx');
  const outPath = join(OG_DIR, `${slug}.png`);
  const content = await readFile(join(BLOGS_DIR, file), 'utf8');
  const fm = parseFrontmatter(content);

  // Skip drafts
  if (fm.draft === 'true') {
    console.log(`[og] Skipping draft: ${slug}`);
    continue;
  }

  if (!fm.title) {
    console.warn(`[og] No title found for ${file} — skipping.`);
    continue;
  }

  // Cache check: hash frontmatter fields used in image
  const hash = frontmatterHash(fm);
  const hashFile = join(OG_DIR, `.${slug}.hash`);
  if (existsSync(outPath) && existsSync(hashFile)) {
    const existing = await readFile(hashFile, 'utf8');
    if (existing.trim() === hash) {
      console.log(`[og] ${slug}.png up to date — skipping.`);
      continue;
    }
  }

  console.log(`[og] Generating ${slug}.png...`);
  try {
    const rt = estimateReadingTime(content);
    const date = formatDate(fm.date);
    const png = await generateImage(postLayout(fm.title, date, rt));
    await writeFile(outPath, png);
    await writeFile(hashFile, hash);
    console.log(`[og] ${slug}.png done.`);
  } catch (err) {
    console.error(`[og] Failed to generate ${slug}.png:`, err.message);
  }
}

console.log('[og] OG image generation complete.');