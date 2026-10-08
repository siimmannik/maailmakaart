/* ---------- Abivahendid ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = v => v.toFixed(1).replace('.', ',');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k, d) { try { const v = localStorage.getItem('mok1:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mok1:' + k, JSON.stringify(v)); } catch (e) { /* salvestamine pole võimalik */ } }
};

/* ---------- Edenemine: iga üksus 0–3 tähte ---------- */
const PROG = store.get('progress', {});
const BEST = store.get('best', {});
function rate(key, correct) {
  if (!BY[key]) return;
  const r = PROG[key] || (PROG[key] = { b: 0, ok: 0, bad: 0 });
  if (correct) { r.ok++; r.b = Math.min(3, r.b + 1); } else { r.bad++; r.b = Math.max(0, r.b - 1); }
  store.set('progress', PROG); updateStars();
}
const starsOf = key => (PROG[key] ? PROG[key].b : 0);
function totalStars() { return ITEMS.reduce((s, i) => s + starsOf(i.key), 0); }
function updateStars() {
  const n = totalStars(), max = ITEMS.length * 3;
  $('#starCount').textContent = n + '/' + max;
  $('#starBar').style.width = (100 * n / max) + '%';
}
function starHTML(n, max = 3) { let s = ''; for (let i = 0; i < max; i++) s += i < n ? '★' : '<span class="off">★</span>'; return `<span class="stars" aria-label="${n} tähte ${max}-st">${s}</span>`; }
function saveBest(id, pct) { if (!(BEST[id] >= pct)) { BEST[id] = pct; store.set('best', BEST); } }

/* ---------- Heli ---------- */
const Snd = {
  on: store.get('sound', true), ctx: null,
  tone(f, t, d, type = 'sine', g = 0.11) {
    const c = this.ctx, o = c.createOscillator(), v = c.createGain();
    o.type = type; o.frequency.value = f; v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(g, t + 0.015); v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v).connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  },
  play(kind) {
    if (!this.on) return;
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx; if (c.state === 'suspended') c.resume();
      const t = c.currentTime + 0.01;
      if (kind === 'ok') { this.tone(660, t, 0.14); this.tone(988, t + 0.09, 0.22); }
      else if (kind === 'bad') { this.tone(220, t, 0.25, 'triangle', 0.13); this.tone(165, t + 0.08, 0.28, 'triangle', 0.1); }
      else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.11, 0.26)); }
      else if (kind === 'tap') { this.tone(740, t, 0.06, 'sine', 0.05); }
    } catch (e) { /* heli pole saadaval */ }
  }
};
function soundIcon() {
  const b = $('#soundBtn'); b.setAttribute('aria-pressed', String(Snd.on));
  b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/>${Snd.on ? '<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>' : '<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;
}

/* ---------- Konfetid ---------- */
function confetti() {
  if (reduceMotion) return;
  const cv = $('#confetti'), cx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#f0c04a', '#ef9442', '#e2694e', '#9c5aa8', '#7db04b', '#3b78b0', '#d9719b'];
  const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6 }));
  const t0 = performance.now();
  (function frame(t) {
    cx.clearRect(0, 0, cv.width, cv.height);
    for (const p of ps) { p.x += p.vx; p.y += p.vy; p.vy += 0.35; p.a += 0.15; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); }
    if (t - t0 < 2200) requestAnimationFrame(frame); else cx.clearRect(0, 0, cv.width, cv.height);
  })(t0);
}

/* ---------- Kaart ---------- */
const MD = window.MAPDATA;
const LINE_NAMES = { ekvaator: 'Ekvaator', pohjapoorijoon: 'Põhjapöörijoon', lounapoorijoon: 'Lõunapöörijoon', pohjapolaarjoon: 'Põhjapolaarjoon', lounapolaarjoon: 'Lõunapolaarjoon' };
const LABELS = {
  ct: [['ct:euraasia', 'Euraasia', 'c:euraasia'], ['ct:aafrika', 'Aafrika', 'c:aafrika'], ['ct:pohja-ameerika', 'Põhja-Ameerika', 'c:pohja-ameerika'], ['ct:louna-ameerika', 'Lõuna-Ameerika', 'c:louna-ameerika'], ['ct:austraalia', 'Austraalia', 'c:austraalia'], ['ct:antarktis', 'Antarktis', 'c:antarktis']],
  wp: [['wp:euroopa', 'EUROOPA', 'w:euroopa'], ['wp:aasia', 'AASIA', 'w:aasia'], ['wp:aafrika', 'AAFRIKA', 'w:aafrika'], ['wp:ameerika', 'AMEERIKA', 'w:ameerika'], ['wp:austraalia-okeaania', 'AUSTRAALIA|JA OKEAANIA', 'w:austraalia-okeaania'], ['wp:antarktika', 'ANTARKTIKA', 'w:antarktika']],
  oc: [['oc:vaikne', 'VAIKNE|OOKEAN', 'o:vaikne'], ['oc:vaikne', 'VAIKNE|OOKEAN', 'o:vaikne2'], ['oc:atlandi', 'ATLANDI|OOKEAN', 'o:atlandi'], ['oc:india', 'INDIA|OOKEAN', 'o:india'], ['oc:louna-jaameri', 'LÕUNA-JÄÄMERI', 'o:louna-jaameri'], ['oc:pohja-jaameri', 'PÕHJA-JÄÄMERI', 'o:pohja-jaameri']]
};
const MS = {
  layer: 'ct', labels: true, lines: true, explore: true,
  fills: {}, cls: {}, focus: null, neutral: false, placed: {}, hov: null,
  els: [], land: [], ocean: [], onPick: null,
  vb: { x: 0, y: 0, w: MD.w, h: MD.h }
};
function keysOf(e) {
  const d = e.dataset;
  if (d.oc) return ['oc:' + d.oc];
  if (d.lake) return ['lake:' + d.lake];
  return [d.ct ? 'ct:' + d.ct : 'isl:' + (d.isl || ''), 'wp:' + d.wp];
}
function regionKey(e, layer = MS.layer) {
  const k = e._k;
  if (e.dataset.oc) return layer === 'oc' ? k[0] : 'sea';
  if (e.dataset.lake) return k[0];
  return layer === 'wp' ? k[1] : layer === 'ct' ? k[0] : 'land';
}
function buildMap() {
  const svg = $('#map'); const ns = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', `0 0 ${MD.w} ${MD.h}`);
  let s = `<path class="sphere" d="${MD.sphere}"/><g id="gOcean">`;
  for (const o of MD.oceans) s += `<path class="rg ocean" data-oc="${o.id}" fill-rule="evenodd" d="${o.d}"/>`;
  s += '</g><g id="gLake">';
  for (const l of MD.lakes) s += `<path class="rg lake" data-lake="${l.id}" d="${l.d}"/>`;
  s += '</g><g id="gLand">';
  for (const l of MD.land) s += `<path class="rg land" data-wp="${l.wp}"${l.ct ? ` data-ct="${l.ct}"` : ''}${l.isl ? ` data-isl="${esc(l.isl)}"` : ''} d="${l.d}"/>`;
  s += '</g><g class="grat" id="gGrat">';
  for (const [k, d] of Object.entries(MD.lines)) {
    if (!LINE_NAMES[k]) continue;
    const [x, y] = MD.pts['l:' + k];
    s += `<path d="${d}"/><text x="${x}" y="${y - 3}">${LINE_NAMES[k]}</text>`;
  }
  const [ex, ey] = MD.pts.tallinn;
  s += `</g><path class="outline" d="${MD.sphere}"/><g id="gLbl"></g><g id="gMark"><circle class="est" cx="${ex}" cy="${ey}" r="2.6"><title>Eesti</title></circle></g>`;
  svg.innerHTML = s;
  MS.land = $$('#gLand path'); MS.ocean = $$('#gOcean path');
  MS.els = [...MS.ocean, ...$$('#gLake path'), ...MS.land];
  for (const e of MS.els) e._k = keysOf(e);
  void ns;
}
function paint() {
  const L = MS.layer;
  $('#map').classList.toggle('lay-oc', L === 'oc');
  for (const e of MS.land) {
    const [k0, kw] = e._k; let f;
    if (MS.neutral || L === 'oc') f = 'var(--land)';
    else if (L === 'ct') f = e.dataset.ct ? colorOf(k0) : 'var(--island)';
    else f = colorOf(kw);
    if (MS.fills[k0]) f = MS.fills[k0]; else if (MS.fills[kw]) f = MS.fills[kw];
    e.style.fill = f; e.style.stroke = f;
  }
  for (const e of MS.ocean) {
    const k = e._k[0]; let f = (L === 'oc' && !MS.neutral) ? colorOf(k) : 'var(--sea)';
    if (MS.fills[k]) f = MS.fills[k];
    e.style.fill = f;
  }
  applyClasses(); drawLabels();
  $('#gGrat').style.display = MS.lines ? '' : 'none';
  $('#gMark').style.display = MS.explore ? '' : 'none';
}
function applyClasses() {
  const focus = MS.focus, oceanKind = MS.layer === 'oc';
  for (const e of MS.els) {
    const cl = [];
    for (const k of e._k) if (MS.cls[k]) cl.push(MS.cls[k]);
    if (focus && !e._k.some(k => focus.includes(k)) && (oceanKind ? e.dataset.oc : e.dataset.wp)) cl.push('dim');
    const base = e.dataset.oc ? 'rg ocean' : e.dataset.lake ? 'rg lake' : 'rg land';
    e.setAttribute('class', base + (cl.length ? ' ' + cl.join(' ') : ''));
  }
  MS.hov = null;
}
function labelSVG(text, key, x, y, cls) {
  const lines = text.split('|'), lh = 1.15;
  const ts = lines.map((t, i) => `<tspan x="${x}" dy="${i === 0 ? (-(lines.length - 1) * lh / 2) + 'em' : lh + 'em'}">${esc(t)}</tspan>`).join('');
  return `<text class="lbl ${cls}" x="${x}" y="${y}" data-key="${key}">${ts}</text>`;
}
function drawLabels() {
  let s = '';
  const placedKeys = Object.keys(MS.placed);
  if (MS.labels) for (const [key, text, pt] of LABELS[MS.layer]) { if (!MS.placed[key]) { const [x, y] = MD.pts[pt]; s += labelSVG(text, key, x, y, MS.layer); } }
  for (const key of placedKeys) {
    const t = key.split(':')[0];
    for (const [k, text, pt] of LABELS[t]) if (k === key) { const [x, y] = MD.pts[pt]; s += labelSVG(text, key, x, y, t + ' ' + MS.placed[key]); }
  }
  $('#gLbl').innerHTML = s;
}
function setHover(key) {
  if (MS.hov === key) return; MS.hov = key;
  const live = key && key !== 'sea' && key !== 'land';
  for (const e of MS.els) e.classList.toggle('hov', !!live && regionKey(e) === key);
}
function resetMapState(layer) {
  MS.fills = {}; MS.cls = {}; MS.focus = null; MS.neutral = false; MS.placed = {}; MS.onPick = null;
  if (layer) MS.layer = layer;
  syncLayerSeg(); paint();
}
function syncLayerSeg() { for (const b of $$('#layerSeg button')) b.setAttribute('aria-pressed', String(b.dataset.layer === MS.layer)); }
function flash(keys, cls, ms = 900) {
  for (const k of keys) MS.cls[k] = cls; applyClasses();
  setTimeout(() => { for (const k of keys) if (MS.cls[k] === cls) delete MS.cls[k]; applyClasses(); }, ms);
}
function tipText(key) {
  if (!key || key === 'sea' || key === 'land') return '';
  if (key.startsWith('isl:')) { const n = key.slice(4); return n ? `${esc(n)}<small>saar</small>` : 'Saar'; }
  if (key === 'lake:kaspia') return 'Kaspia meri<small>järv</small>';
  const it = BY[key]; return it ? `${esc(it.name)}<small>${TYPE_NAME[it.type]}</small>` : '';
}
/* suum ja nihutamine */
function setVB(x, y, w) {
  w = clamp(w, MD.w / 8, MD.w); const h = w * MD.h / MD.w;
  x = clamp(x, 0, MD.w - w); y = clamp(y, 0, MD.h - h);
  MS.vb = { x, y, w, h };
  const svg = $('#map'); svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`); svg.style.setProperty('--z', (MD.w / w).toFixed(3));
  $('#mapwrap').style.touchAction = w < MD.w - 1 ? 'none' : 'pan-y';
}
function zoomAt(f, cx, cy) {
  const { x, y, w } = MS.vb; const nw = clamp(w / f, MD.w / 8, MD.w);
  if (cx == null) { cx = x + w / 2; cy = y + MS.vb.h / 2; }
  setVB(cx - (cx - x) * nw / w, cy - (cy - y) * nw / w, nw);
}
function svgPoint(cx, cy) { const r = $('#map').getBoundingClientRect(); return [MS.vb.x + (cx - r.left) / r.width * MS.vb.w, MS.vb.y + (cy - r.top) / r.height * MS.vb.h]; }
function hitAt(cx, cy) { const t = document.elementFromPoint(cx, cy); return t && t.closest ? t.closest('#map .rg') : null; }
function initMapInput() {
  const wrap = $('#mapwrap'), tip = $('#tip'); const ptrs = new globalThis.Map(); let start = null, moved = false, pinch = null;
  wrap.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), w: MS.vb.w }; moved = true; return; }
    start = { x: e.clientX, y: e.clientY, vb: { ...MS.vb } }; moved = false;
  });
  wrap.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const [mx, my] = svgPoint((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); zoomAt(MS.vb.w / (pinch.w * pinch.d / d), mx, my); return;
    }
    if (start && ptrs.size === 1) {
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) > 7) { moved = true; if (MS.vb.w < MD.w - 1) wrap.setPointerCapture(e.pointerId); }
      if (moved && MS.vb.w < MD.w - 1) { const r = $('#map').getBoundingClientRect(); setVB(start.vb.x - dx / r.width * start.vb.w, start.vb.y - dy / r.height * start.vb.h, start.vb.w); }
      return;
    }
    if (e.pointerType === 'mouse') {
      const t = hitAt(e.clientX, e.clientY); const key = t ? regionKey(t) : null;
      const txt = MS.explore ? tipText(key) : '';
      if (MS.explore) setHover(key); else setHover(null);
      if (txt) { const r = wrap.getBoundingClientRect(); tip.innerHTML = txt; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.classList.add('on'); }
      else tip.classList.remove('on');
      wrap.style.cursor = t && MS.onPick ? 'pointer' : '';
    }
  });
  const end = e => {
    const was = ptrs.has(e.pointerId); ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!was || e.type === 'pointercancel') { start = null; return; }
    if (start && !moved && ptrs.size === 0) {
      const t = hitAt(e.clientX, e.clientY);
      if (t && MS.explore && e.pointerType !== 'mouse') { const txt = tipText(regionKey(t)); if (txt) { const r = wrap.getBoundingClientRect(); tip.innerHTML = txt; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.classList.add('on'); clearTimeout(tip._t); tip._t = setTimeout(() => tip.classList.remove('on'), 1600); } }
      if (t && MS.onPick) MS.onPick(t, t._k, regionKey(t));
    }
    if (ptrs.size === 0) start = null;
  };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);
  wrap.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { tip.classList.remove('on'); setHover(null); } });
  wrap.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const [x, y] = svgPoint(e.clientX, e.clientY); zoomAt(Math.exp(-e.deltaY * 0.01), x, y); }, { passive: false });
  const ro = () => { const w = $('#map').getBoundingClientRect().width || MD.w; $('#map').style.setProperty('--ls', clamp(MD.w / w * 0.72, 1, 2.3).toFixed(2)); };
  if (window.ResizeObserver) new ResizeObserver(ro).observe($('#map')); ro();
  for (const b of $$('.zoom button')) b.addEventListener('pointerdown', ev => ev.stopPropagation());
  $('#zIn').onclick = () => zoomAt(1.6); $('#zOut').onclick = () => zoomAt(1 / 1.6); $('#zReset').onclick = () => setVB(0, 0, MD.w);
}
function hint(t) { $('#maphint').innerHTML = t || ''; }
