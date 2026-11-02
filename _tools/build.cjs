#!/usr/bin/env node
// Yoch AI site builder.
//   node _tools/build.cjs            → encode any missing media, then write the works into index.html
//   node _tools/build.cjs --html     → only rewrite index.html (no encoding)
//   node _tools/build.cjs --force id → re-encode one work (e.g. after changing previewStart)
//
// Source of truth: assets/data/works.json (the works) and assets/data/site.json (contact, categories, proof).
// The site itself needs no build: index.html is plain HTML that this script keeps in sync with works.json.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'assets', 'data');
const MEDIA = path.join(ROOT, 'assets', 'media');
const INDEX = path.join(ROOT, 'index.html');
const args = process.argv.slice(2);
const htmlOnly = args.includes('--html');
const forceIds = args.filter((a, i) => args[i - 1] === '--force');

const works = JSON.parse(fs.readFileSync(path.join(DATA, 'works.json'), 'utf8'));
const site = JSON.parse(fs.readFileSync(path.join(DATA, 'site.json'), 'utf8'));

// ---------- media ----------
const run = (cmd, argv) => execFileSync(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const probe = (file) => {
  const out = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]).toString());
  const v = out.streams.find((s) => s.codec_type === 'video');
  return { w: v.width, h: v.height, duration: Number(out.format.duration), audio: out.streams.some((s) => s.codec_type === 'audio') };
};
const scale = (vertical, long) => (vertical ? `scale=-2:'min(${long},ih)'` : `scale='min(${long},iw)':-2`);
const ff = (argv) => run('ffmpeg', ['-nostdin', '-hide_banner', '-v', 'error', '-y', ...argv]);

// "source" may use * for part of the file name (e.g. to keep a private name out of the public repo).
function resolveSource(rel) {
  const abs = path.resolve(ROOT, rel);
  if (!abs.includes('*')) return abs;
  const dir = path.dirname(abs);
  const re = new RegExp('^' + path.basename(abs).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  const hits = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)) : [];
  if (hits.length !== 1) { console.warn(`! source pattern ${rel} matched ${hits.length} files`); return abs; }
  return path.join(dir, hits[0]);
}

function encode(w) {
  const src = resolveSource(w.source);
  if (!fs.existsSync(src)) { console.warn(`! ${w.id}: source not found → ${src}`); return null; }
  const dir = path.join(MEDIA, w.id);
  fs.mkdirSync(dir, { recursive: true });
  // "_" prefix: GitHub Pages (Jekyll) never publishes it. It holds sizes, duration and the tiny placeholder.
  const metaFile = path.join(dir, '_meta.json');
  const force = forceIds.includes(w.id);
  const info = probe(src);
  const vertical = info.h >= info.w;
  const start = Math.max(0, Math.min(Number(w.previewStart) || 0, info.duration - 8));
  const posterT = w.posterTime != null ? Number(w.posterTime) : start;
  const out = (f) => path.join(dir, f);
  const need = (f) => force || !fs.existsSync(out(f));
  const x264 = ['-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart'];

  if (need('preview.mp4')) {
    console.log(`  ${w.id}: preview`);
    ff(['-ss', String(start), '-t', '8', '-i', src, '-map', '0:v:0', '-an', '-sn', '-dn', '-vf', scale(vertical, 720),
      ...x264, '-preset', 'slow', '-crf', '27', '-maxrate', '1200k', '-bufsize', '2400k', '-level:v', '3.1', '-g', '48', out('preview.mp4')]);
  }
  if (w.hero && need('hero.mp4')) {
    console.log(`  ${w.id}: hero`);
    ff(['-ss', String(start), '-t', '8', '-i', src, '-map', '0:v:0', '-an', '-sn', '-dn', '-vf', scale(vertical, 1080),
      ...x264, '-preset', 'slow', '-crf', '25', '-maxrate', '2500k', '-bufsize', '5000k', '-level:v', '4.0', '-g', '48', out('hero.mp4')]);
  }
  if (need('full.mp4')) {
    console.log(`  ${w.id}: full (${Math.round(info.duration)}s)`);
    const long = info.duration > 120;
    const rate = vertical ? (long ? '2000k' : '3000k') : (long ? '1400k' : '2200k');
    ff(['-i', src, '-map', '0:v:0', '-map', '0:a:0?', '-sn', '-dn', '-vf', scale(vertical, vertical ? 1080 : 1280),
      ...x264, '-preset', 'medium', '-crf', vertical ? '23' : '24', '-maxrate', rate, '-bufsize', String(parseInt(rate) * 2) + 'k',
      '-level:v', '4.0', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', out('full.mp4')]);
  }
  if (need('poster.webp')) {
    ff(['-ss', String(posterT), '-i', src, '-frames:v', '1', '-vf', scale(vertical, 720), '-c:v', 'libwebp', '-quality', '72', '-compression_level', '6', out('poster.webp')]);
  }
  if (need('poster-lg.webp')) {
    ff(['-ss', String(posterT), '-i', src, '-frames:v', '1', '-vf', scale(vertical, vertical ? 1080 : 1280), '-c:v', 'libwebp', '-quality', '70', '-compression_level', '6', out('poster-lg.webp')]);
  }
  let meta = fs.existsSync(metaFile) && !force ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : null;
  if (!meta || meta.previewStart !== start || meta.posterTime !== posterT) {
    const lqip = run('ffmpeg', ['-nostdin', '-v', 'error', '-ss', String(posterT), '-i', src, '-frames:v', '1', '-vf', 'scale=16:-2', '-q:v', '10', '-f', 'image2', '-c:v', 'mjpeg', 'pipe:1']);
    const pw = vertical ? Math.round(720 * info.w / info.h / 2) * 2 : 720;
    const ph = vertical ? 720 : Math.round(720 * info.h / info.w / 2) * 2;
    meta = { previewStart: start, posterTime: posterT, w: info.w, h: info.h, duration: info.duration, vertical,
      poster: { w: pw, h: ph }, lqip: 'data:image/jpeg;base64,' + lqip.toString('base64') };
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  }
  return meta;
}

// ---------- html ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mmss = (sec) => { const s = Math.round(sec); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ltr = (s) => `<span dir="ltr">${esc(s)}</span>`;
const hasLatin = (s) => /^[\x00-\x7F]+$/.test(s);
const titleHtml = (t) => (hasLatin(t) ? `<span dir="ltr">${esc(t)}</span>` : esc(t));
const m = (w) => `assets/media/${w.id}`;
const catLabel = (id) => (site.categories.find((c) => c.id === id) || { label: id }).label;

function posterImg(w, meta, { eager = false, sizes, decorative = false } = {}) {
  const lgW = meta.vertical ? Math.round(1080 * meta.w / meta.h / 2) * 2 : 1280;
  return `<img class="poster" src="${m(w)}/poster.webp" srcset="${m(w)}/poster.webp ${meta.poster.w}w, ${m(w)}/poster-lg.webp ${lgW}w" sizes="${sizes}"`
    + ` width="${meta.poster.w}" height="${meta.poster.h}" alt="${decorative ? '' : esc(w.alt || w.title)}"`
    + (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ` decoding="async" style="background-image:url(${meta.lqip})">`;
}
const videoTag = (w, extra = '') => `<video muted playsinline loop preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1" data-src="${m(w)}/preview.mp4"${extra}></video>`;
const playAttrs = (w, meta) => `href="${m(w)}/full.mp4" data-play data-full="${m(w)}/full.mp4" data-poster="${m(w)}/poster-lg.webp"`
  + ` data-title="${esc(w.title)}" data-kind="${esc(w.stat)} · ${mmss(meta.duration)}" data-ar="${meta.vertical ? 'v' : 'h'}"`;

function render() {
  const metas = {};
  for (const w of works) {
    const f = path.join(MEDIA, w.id, '_meta.json');
    if (fs.existsSync(f)) metas[w.id] = JSON.parse(fs.readFileSync(f, 'utf8'));
  }
  const ready = works.filter((w) => metas[w.id] && !w.hidden);
  const grid = ready.filter((w) => !w.about);
  const hero = ready.filter((w) => w.hero).slice(0, 4);
  const featured = ready.find((w) => w.featured);
  const about = ready.find((w) => w.about);

  const heroHtml = hero.map((w, i) => {
    const meta = metas[w.id];
    return `<figure class="frame hero-tile"${i > 1 ? ' data-wide-only' : ''}>${posterImg(w, meta, { eager: i < 2, decorative: true, sizes: '(min-width: 900px) 25vw, 50vw' })}`
      + `${videoTag(w, ` data-src-lg="${m(w)}/hero.mp4" data-hero`)}<figcaption class="fn" aria-hidden="true">${String(i + 1).padStart(2, '0')}A</figcaption></figure>`;
  }).join('\n      ');

  const proofHtml = site.proof && site.proof.length
    ? `<section class="proof" aria-label="במספרים"><ul class="proof-list">${site.proof.map((p) => `<li><span class="proof-num" data-count="${esc(p.value)}" dir="ltr">${esc(p.display || p.value)}</span><span class="proof-label">${esc(p.label)}</span></li>`).join('')}</ul></section>`
    : '';

  let featuredHtml = '';
  if (featured) {
    const meta = metas[featured.id];
    const text = (featured.featuredText || [featured.pitch]).map((p) => `<p>${esc(p)}</p>`).join('');
    featuredHtml = `<section class="featured" aria-labelledby="featured-title">
    <div class="feat-media">
      <a class="frame" ${playAttrs(featured, meta)} aria-label="צפייה עם סאונד: ${esc(featured.title)}">
        ${posterImg(featured, meta, { sizes: '(min-width: 900px) 34vw, 80vw' })}
        ${videoTag(featured)}
        <span class="play-chip" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>צפו עם סאונד</span>
      </a>
      <svg class="pencil-box" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 6 C30 2 70 4 97 4 C99 50 98 110 97 156 C66 159 32 158 3 155 C1 110 2 52 4 2"/></svg>
      <span class="pencil-note" aria-hidden="true">הבחירה שלי</span>
    </div>
    <div class="feat-copy">
      <p class="feat-kind">${esc(featured.stat)} · ${ltr(mmss(meta.duration))}</p>
      <h2 id="featured-title" class="feat-title">${titleHtml(featured.title)}</h2>
      ${text}
      <a class="btn btn-line" ${playAttrs(featured, meta)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>צפו בסרט עם סאונד</a>
    </div>
  </section>`;
  }

  const cats = site.categories.filter((c) => grid.some((w) => w.category === c.id));
  const tabsHtml = `<button type="button" class="tab" aria-pressed="true" data-filter="all">הכול <span class="tab-n" dir="ltr">${grid.length}</span></button>`
    + cats.map((c) => `<button type="button" class="tab" aria-pressed="false" data-filter="${c.id}">${esc(c.label)} <span class="tab-n" dir="ltr">${grid.filter((w) => w.category === c.id).length}</span></button>`).join('');

  const gridHtml = grid.map((w, i) => {
    const meta = metas[w.id];
    const link = w.link ? `<a class="card-link" href="${esc(w.link)}" target="_blank" rel="noopener">לסרט באינסטגרם</a>` : '';
    return `<li class="card" data-cat="${w.category}" data-ar="${meta.vertical ? 'v' : 'h'}" style="--ar:${meta.poster.w}/${meta.poster.h}">
        <a class="frame" ${playAttrs(w, meta)} aria-label="צפייה עם סאונד: ${esc(w.title)}">
          ${posterImg(w, meta, { sizes: '(min-width: 1280px) 22vw, (min-width: 700px) 30vw, 46vw' })}
          ${videoTag(w)}
          <span class="fn" aria-hidden="true">${String(i + 1).padStart(2, '0')}A</span>
          <span class="play-chip" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>צפו עם סאונד</span>
        </a>
        <div class="cap">
          <h3 class="card-title">${titleHtml(w.title)}</h3>
          <p class="card-pitch">${esc(w.pitch)}</p>
          <p class="card-stat">${esc(w.stat)} · ${ltr(mmss(meta.duration))}</p>${link}
        </div>
      </li>`;
  }).join('\n      ');

  let aboutHtml = '';
  if (site.photo) {
    aboutHtml += `<img class="about-photo" src="${esc(site.photo)}" alt="יוכבד פולונסקי" loading="lazy" decoding="async">`;
  }
  if (about) {
    const meta = metas[about.id];
    aboutHtml += `<figure class="about-film">
        <a class="frame" ${playAttrs(about, meta)} aria-label="צפייה עם סאונד: ${esc(about.title)}">
          ${posterImg(about, meta, { sizes: '(min-width: 900px) 26vw, 70vw' })}
          ${videoTag(about)}
          <span class="play-chip" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>צפו עם סאונד</span>
        </a>
        <figcaption>${esc(about.pitch)} ${ltr(mmss(meta.duration))}</figcaption>
      </figure>`;
  }

  let html = fs.readFileSync(INDEX, 'utf8');
  const put = (name, content) => {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) throw new Error(`marker build:${name} missing in index.html`);
    html = html.replace(re, `$1\n      ${content}\n      $2`);
  };
  put('hero', heroHtml);
  put('proof', proofHtml);
  put('featured', featuredHtml);
  put('tabs', tabsHtml);
  put('grid', gridHtml);
  put('about-media', aboutHtml);

  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(site.whatsappText)}`;
  html = html.replace(/href="[^"]*"(\s+data-wa)/g, `href="${esc(wa)}"$1`)
    .replace(/href="[^"]*"(\s+data-mail)/g, `href="mailto:${esc(site.email)}"$1`)
    .replace(/href="[^"]*"(\s+data-tel)/g, `href="tel:+${site.whatsapp}"$1`)
    .replace(/href="[^"]*"(\s+data-ig)/g, `href="https://www.instagram.com/${esc(site.instagram)}/"$1`);
  // Canonical + absolute share-image URLs only once the real address is known (site.json → "url").
  const u = site.url ? site.url.replace(/\/?$/, '/') : '';
  put('url', u ? `<link rel="canonical" href="${esc(u)}">\n  <meta property="og:url" content="${esc(u)}">` : '');
  html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*(")/g, `$1${esc(u)}assets/og.jpg$2`);
  fs.writeFileSync(INDEX, html);
  console.log(`index.html: ${grid.length} works in the grid, ${hero.length} hero tiles, featured: ${featured ? featured.id : 'none'}, tabs: ${cats.map((c) => c.id).join(', ')}`);
}

if (!htmlOnly) {
  for (const w of works) {
    const t = Date.now();
    process.stdout.write(`${w.id}\n`);
    encode(w);
    console.log(`  done in ${((Date.now() - t) / 1000).toFixed(0)}s`);
  }
}
if (!args.includes('--media')) render();
