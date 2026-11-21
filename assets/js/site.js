// Yoch AI — page behaviour. Plain JS, no dependencies.
// 1. Video controller: previews load only when half visible; at most 2 (narrow) / 4 (wide) play at once.
// 2. Work grid: field tabs + an offset-column layout.
// 3. Full-screen player with sound (native <dialog>; Esc, close button and Back all close it).
// 4. Floating WhatsApp button, count-up numbers.
// 5. Accessibility menu: a side button with text size, high contrast, highlighted links and readable font.
// The stop-motion button in the header (part of 1) pauses every moving preview and the marquee.
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

  // Stop-motion button in the header (WCAG 2.2.2): stops the moving previews and the marquee. The choice is kept across pages;
  // with no choice yet, "reduce motion" and Save-Data start stopped (posters only), and the button can still start them.
  // (22.11.2026: she wants it in the header, not inside the accessibility menu.)
  const motionBtn = document.querySelector('[data-motion]');
  const motionLabels = root.lang === 'en' ? ['Pause motion', 'Play motion'] : ['עצירת תנועה', 'הפעלת תנועה'];
  const savedMotion = (() => { try { return localStorage.getItem('yoch-motion'); } catch (e) { return null; } })();
  let stopped = savedMotion ? savedMotion === 'off' : (reduce || saveData);
  const paintMotion = () => {
    root.classList.toggle('motion-off', stopped);
    root.classList.toggle('media-static', stopped);
    if (motionBtn) { const l = motionLabels[stopped ? 1 : 0]; motionBtn.setAttribute('aria-label', l); motionBtn.title = l; }
  };
  paintMotion();

  const reconcile = raf(() => {
    if (document.hidden || suspended || stopped) { vids.forEach((v) => v.paused || v.pause()); return; }
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

  if ('IntersectionObserver' in window && vids.length) {
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
  if (motionBtn) {
    motionBtn.hidden = false;
    motionBtn.addEventListener('click', () => {
      stopped = !stopped;
      try { localStorage.setItem('yoch-motion', stopped ? 'off' : 'on'); } catch (e) { /* private mode: works for this page only */ }
      paintMotion();
      reconcile();
    });
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
    // getBoundingClientRect is in screen px; grid rows are in CSS px, which differ when the text size (CSS zoom) is raised
    const k = (grid.getBoundingClientRect().width / grid.offsetWidth) || 1;
    const heights = shown.map((c) => c.getBoundingClientRect().height / k);
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

  /* ---------- 5. accessibility menu ---------- */
  // Settings live in localStorage "yoch-a11y" ({size, contrast, links, font}); a tiny script in each page's <head>
  // applies them before the first paint. The header stop-motion button keeps its own key ("yoch-motion", section 1).
  const he = root.lang !== 'en';
  const TX = he
    ? { menu: 'תפריט נגישות', title: 'נגישות', close: 'סגירת תפריט הנגישות', size: 'גודל טקסט', smaller: 'הקטנת טקסט', bigger: 'הגדלת טקסט',
      contrast: 'ניגודיות גבוהה', links: 'הדגשת קישורים', font: 'גופן קריא', reset: 'איפוס הגדרות' }
    : { menu: 'Accessibility menu', title: 'Accessibility', close: 'Close the accessibility menu', size: 'Text size', smaller: 'Smaller text', bigger: 'Larger text',
      contrast: 'High contrast', links: 'Highlight links', font: 'Readable font', reset: 'Reset settings' };
  const SIZES = [1, 1.15, 1.3, 1.5];
  const A11Y_KEY = 'yoch-a11y';
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}') || {}; } catch (e) { prefs = {}; }
  const savePrefs = () => { try { localStorage.setItem(A11Y_KEY, JSON.stringify(prefs)); } catch (e) { /* private mode: this page only */ } };
  const sizeIndex = () => Math.max(0, SIZES.indexOf(prefs.size || 1));
  const applyPrefs = () => {
    root.classList.toggle('a11y-contrast', !!prefs.contrast);
    root.classList.toggle('a11y-links', !!prefs.links);
    root.classList.toggle('a11y-font', !!prefs.font);
    root.style.zoom = prefs.size > 1 ? String(prefs.size) : '';
    root.classList.toggle('a11y-zoom', prefs.size > 1);
  };
  applyPrefs();

  const skip = document.querySelector('.skip');
  const box = document.createElement('div');
  box.className = 'a11y';
  const opt = (key) => `<button class="a11y-opt" type="button" data-opt="${key}" aria-pressed="false">${TX[key]}</button>`;
  box.innerHTML = `<button class="a11y-btn" type="button" aria-expanded="false" aria-controls="a11y-panel" aria-label="${TX.menu}" title="${TX.menu}">`
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.2" r="2.2"/><path d="M3.6 7.6l.5-1.9c2.6.7 5.2 1.1 7.9 1.1s5.3-.4 7.9-1.1l.5 1.9c-1.9.5-3.8.9-5.8 1.1v4.1l2.1 8.1-1.9.5-2.2-7.6h-1.2l-2.2 7.6-1.9-.5 2.1-8.1V8.7c-2-.2-3.9-.6-5.8-1.1z"/></svg></button>'
    + `<div class="a11y-panel" id="a11y-panel" role="dialog" aria-modal="false" aria-labelledby="a11y-title" tabindex="-1" hidden>`
    + `<div class="a11y-head"><h2 id="a11y-title">${TX.title}</h2><button class="a11y-x" type="button" aria-label="${TX.close}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>`
    + `<div class="a11y-size" role="group" aria-labelledby="a11y-size-label"><span id="a11y-size-label">${TX.size}</span><span class="a11y-steps">`
    + `<button type="button" data-step="-1" aria-label="${TX.smaller}">−</button><output aria-live="polite"></output><button type="button" data-step="1" aria-label="${TX.bigger}">+</button></span></div>`
    + opt('contrast') + opt('links') + opt('font')
    + `<button class="a11y-reset" type="button">${TX.reset}</button></div>`;
  if (skip) skip.after(box); else document.body.prepend(box);

  const btn = box.querySelector('.a11y-btn');
  const panel = box.querySelector('.a11y-panel');
  const out = box.querySelector('output');
  const [minus, plus] = box.querySelectorAll('[data-step]');
  const paintMenu = () => {
    box.querySelectorAll('[data-opt]').forEach((b) => b.setAttribute('aria-pressed', String(!!prefs[b.dataset.opt])));
    const i = sizeIndex();
    out.textContent = `${Math.round(SIZES[i] * 100)}%`;
    minus.setAttribute('aria-disabled', String(i === 0));
    plus.setAttribute('aria-disabled', String(i === SIZES.length - 1));
  };
  paintMenu();

  const openMenu = () => { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); panel.focus(); };
  const closeMenu = (returnFocus) => {
    if (panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) btn.focus();
  };
  btn.addEventListener('click', () => (panel.hidden ? openMenu() : closeMenu(false)));
  box.querySelector('.a11y-x').addEventListener('click', () => closeMenu(true));
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); closeMenu(true); } });
  document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !box.contains(e.target)) closeMenu(false); });

  const changed = () => { savePrefs(); applyPrefs(); paintMenu(); relayout(); };
  box.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const i = Math.min(SIZES.length - 1, Math.max(0, sizeIndex() + Number(b.dataset.step)));
    prefs.size = SIZES[i];
    if (prefs.size === 1) delete prefs.size;
    changed();
  }));
  box.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.opt;
    if (prefs[key]) delete prefs[key]; else prefs[key] = true;
    changed();
  }));
  box.querySelector('.a11y-reset').addEventListener('click', () => {
    prefs = {};
    changed();
  });
})();
