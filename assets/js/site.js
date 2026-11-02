// Yoch AI — page behaviour. Plain JS, no dependencies.
// 1. Video controller: previews load only when half visible; at most 2 (narrow) / 4 (wide) play at once.
// 2. Work grid: field tabs + an offset-column layout.
// 3. Full-screen player with sound (native <dialog>; Esc, close button and Back all close it).
// 4. Floating WhatsApp button, count-up numbers.
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const wide = matchMedia('(min-width: 900px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const raf = (fn) => { let q = false; return () => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(); }); }; };

  /* ---------- 1. video controller ---------- */
  const vids = [...document.querySelectorAll('video[data-src]')];
  const visible = new Set();
  let preferred = null;
  let suspended = false;
  const capFor = () => (wide.matches ? 4 : 2);
  const srcFor = (v) => (v.dataset.srcLg && wide.matches ? v.dataset.srcLg : v.dataset.src);
  const blocked = (v) => !!v.closest('[hidden]');

  const reconcile = raf(() => {
    if (document.hidden || suspended) { vids.forEach((v) => v.paused || v.pause()); return; }
    const want = [...visible].filter((v) => !blocked(v))
      .sort((a, b) => (b === preferred) - (a === preferred) || a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .slice(0, capFor());
    vids.forEach((v) => {
      if (want.includes(v)) {
        const src = srcFor(v);
        if (v.getAttribute('src') !== src) v.setAttribute('src', src);
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      } else if (!v.paused) {
        v.pause();
      }
    });
  });

  if (reduce || saveData) {
    root.classList.add('media-static');
  } else if ('IntersectionObserver' in window && vids.length) {
    vids.forEach((v) => v.addEventListener('playing', () => v.parentElement.classList.add('is-playing'), { once: true }));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      reconcile();
    }, { threshold: 0.5 });
    const start = () => vids.forEach((v) => io.observe(v));
    // Let the first paint (headline, posters) finish before any video decodes.
    if (document.readyState === 'complete') setTimeout(start, 300);
    else addEventListener('load', () => setTimeout(start, 300), { once: true });
    document.addEventListener('visibilitychange', reconcile);
    wide.addEventListener('change', reconcile);
    if (fine) {
      document.querySelectorAll('a.frame').forEach((a) => {
        const v = a.querySelector('video');
        if (!v) return;
        a.addEventListener('pointerenter', () => { preferred = v; reconcile(); });
        a.addEventListener('pointerleave', () => { if (preferred === v) preferred = null; reconcile(); });
      });
    }
  }

  /* ---------- 2. work grid: tabs + offset columns ---------- */
  const grid = document.querySelector('[data-grid]');
  const cards = grid ? [...grid.children] : [];
  const live = document.querySelector('[data-live]');
  const UNIT = 4; // px per implicit grid row (see .grid.is-laid)

  function layout() {
    if (!grid) return;
    const cs = getComputedStyle(grid);
    const cols = parseInt(cs.getPropertyValue('--cols'), 10) || 2;
    const gapY = parseFloat(cs.getPropertyValue('--gap-y')) || 36;
    const offset = Math.round((cols > 2 ? 96 : 56) / UNIT); // every second column starts lower
    const shown = cards.filter((c) => !c.hidden);
    grid.classList.remove('is-laid');
    shown.forEach((c) => { c.style.gridRow = ''; c.style.gridColumn = ''; });
    const heights = shown.map((c) => c.getBoundingClientRect().height);
    const tops = Array.from({ length: cols }, (_, i) => (i % 2 ? offset : 0));
    shown.forEach((c, i) => {
      const col = i % cols; // keep reading order: row by row, starting at the inline start
      const span = Math.ceil((heights[i] + gapY) / UNIT);
      c.style.gridColumn = String(col + 1);
      c.style.gridRow = `${tops[col] + 1} / span ${span}`;
      tops[col] += span;
    });
    grid.classList.add('is-laid');
  }
  const relayout = raf(layout);
  if (grid) {
    layout();
    if ('ResizeObserver' in window) {
      let lastW = 0;
      new ResizeObserver((es) => { const w = es[0].contentRect.width; if (Math.abs(w - lastW) > 1) { lastW = w; relayout(); } }).observe(grid);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  }

  const tabs = [...document.querySelectorAll('.tab[data-filter]')];
  tabs.forEach((t) => t.addEventListener('click', () => {
    const f = t.dataset.filter;
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    let n = 0;
    cards.forEach((c) => {
      const show = f === 'all' || c.dataset.cat === f;
      c.hidden = !show;
      c.classList.remove('is-in');
      if (show) { n += 1; void c.offsetWidth; c.classList.add('is-in'); }
    });
    layout();
    if (live) live.textContent = `מוצגים ${n} סרטים`;
    reconcile();
  }));

  /* ---------- 3. player ---------- */
  const dlg = document.querySelector('dialog.player');
  if (dlg && typeof dlg.showModal === 'function') {
    const pv = dlg.querySelector('.player-video');
    const pTitle = dlg.querySelector('.player-title');
    const pKind = dlg.querySelector('.player-kind');
    let opener = null;
    let pushed = false;

    const open = (a) => {
      opener = a;
      pv.poster = a.dataset.poster || '';
      pv.src = a.dataset.full;
      pTitle.textContent = a.dataset.title || '';
      pKind.textContent = a.dataset.kind || '';
      dlg.classList.toggle('is-wide', a.dataset.ar === 'h');
      suspended = true; reconcile();
      dlg.showModal();
      pv.focus({ preventScroll: true });
      history.pushState({ player: true }, '');
      pushed = true;
      pv.muted = false;
      const p = pv.play();
      if (p && p.catch) p.catch(() => { pv.muted = true; pv.play().catch(() => {}); });
    };
    const close = (fromHistory) => {
      if (!dlg.open) return;
      pv.pause();
      pv.removeAttribute('src');
      pv.load();
      dlg.close();
      suspended = false; reconcile();
      if (pushed && !fromHistory) history.back();
      pushed = false;
      if (opener) opener.focus({ preventScroll: true });
    };

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-play]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      open(a);
    });
    dlg.querySelector('.player-close').addEventListener('click', () => close(false));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(false); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('player-in')) close(false); });
    addEventListener('popstate', () => close(true));
  }

  /* ---------- 4a. floating WhatsApp: only between the hero and the contact section ---------- */
  const fab = document.querySelector('.wa-float');
  const hero = document.querySelector('.hero, .page-head');
  const contact = document.querySelector('#contact');
  if (fab && hero && contact && 'IntersectionObserver' in window) {
    const inView = new Map([[hero, true], [contact, false]]);
    const fio = new IntersectionObserver((es) => {
      es.forEach((e) => inView.set(e.target, e.isIntersecting));
      const on = !inView.get(hero) && !inView.get(contact);
      fab.classList.toggle('is-on', on);
      fab.tabIndex = on ? 0 : -1;
      fab.setAttribute('aria-hidden', String(!on));
    }, { threshold: 0 });
    fio.observe(hero);
    fio.observe(contact);
  }

  /* ---------- 4b. count-up (proof numbers), once ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const final = el.textContent;
      if (!end) return;
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 900);
        el.textContent = k < 1 ? Math.round(end * ease(k)).toLocaleString('he-IL') : final;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }
})();
