/* ---------- Kontuurkaart: nimed tühjale kaardile ---------- */
function startLabels(set) {
  stopGame();
  const items = shuffle(set === 'all' ? ITEMS : ofType(set));
  const g = window.G = { kind: 'labels', set, left: items.length, mistakes: 0, wrongItems: new Set(), t0: Date.now(), sel: null };
  setTools({}); MS.explore = false;
  resetMapState(set === 'ct' || set === 'wp' ? set : 'oc'); MS.neutral = true; MS.labels = false; paint();
  hint('Lohista nimi kaardile – või puuduta nime ja siis kohta kaardil.');
  panel().innerHTML = `<div class="qhead"><div class="grow"><div class="eyebrow">Kontuurkaart · ${SET_NAME[set]}</div><div class="prog" style="margin-top:6px"><i id="lp"></i></div></div><button class="btn ghost sm" id="quit">Lõpeta</button></div>
    <div class="prompt" style="font-size:22px">Pane nimed õigesse kohta</div>
    ${set === 'all' ? '<p class="muted" style="margin:0">Mandrid on kirjutatud tavaliselt, maailmajaod SUURTE TÄHTEDEGA – nagu õpiku kaardil.</p>' : ''}
    <div class="tray" id="tray">${items.map(i => `<button class="drag" data-k="${i.key}">${esc(i.type === 'wp' && set === 'all' ? i.name.toUpperCase() : i.name)}</button>`).join('')}</div><div id="fb"></div>`;
  $('#quit').onclick = () => { stopGame(); setTab('harjuta'); };
  const fb = $('#fb');
  const prog = () => { $('#lp').style.width = (100 * (items.length - g.left) / items.length) + '%'; };
  const tryKeys = (chipEl, ks, key) => {
    if (window.G !== g) return;
    const it = BY[chipEl.dataset.k];
    if (!ks) { chipEl.classList.add('shake'); setTimeout(() => chipEl.classList.remove('shake'), 400); return; }
    if (ks.includes(it.key)) {
      const first = !g.wrongItems.has(it.key); rate(it.key, first);
      MS.placed[it.key] = 'placed'; chipEl.classList.add('done'); chipEl.classList.remove('sel'); chipEl.disabled = true; g.sel = null;
      flash([it.key], 'ok', 700); drawLabels(); Snd.play('ok'); g.left--; prog();
      fb.innerHTML = fbHTML(true, `<b>Õige!</b><span>${esc(it.name)} on paigas.</span>`);
      if (!g.left) finishLabels(g, items);
    } else {
      g.mistakes++; if (!g.wrongItems.has(it.key)) { g.wrongItems.add(it.key); rate(it.key, false); }
      Snd.play('bad'); chipEl.classList.add('shake'); setTimeout(() => chipEl.classList.remove('shake'), 400);
      const k0 = key || ks[0]; if (k0 && k0 !== 'sea' && k0 !== 'land') flash([k0], 'bad', 700);
      fb.innerHTML = fbHTML(false, `<b>Mitte siia.</b><span>${k0 === 'sea' || k0 === 'land' || !k0 ? 'Seal ei ole ' + esc(it.name) + '.' : whatIs(k0)} Proovi uuesti.</span>`);
    }
  };
  MS.onPick = (e, ks, key) => { if (g.sel) tryKeys(g.sel, e._k, key); };
  for (const c of $$('.drag', panel())) {
    c.onpointerdown = e => {
      if (c.disabled) return; e.preventDefault(); c.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY; let far = false, ghost = null;
      c.onpointermove = ev => {
        if (!far && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { far = true; ghost = el(`<div class="ghostlbl">${esc(c.textContent)}</div>`); document.body.append(ghost); }
        if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
      };
      c.onpointerup = ev => {
        c.onpointermove = c.onpointerup = null; if (ghost) ghost.remove();
        if (!far) { for (const o of $$('.drag.sel', panel())) o.classList.remove('sel'); c.classList.add('sel'); g.sel = c; Snd.play('tap'); hint(`Puuduta kaardil kohta, kus on <b>${esc(nm(c.dataset.k))}</b>.`); return; }
        const t = hitAt(ev.clientX, ev.clientY); tryKeys(c, t ? t._k : null, t ? regionKey(t) : null);
      };
      c.onpointercancel = () => { c.onpointermove = c.onpointerup = null; if (ghost) ghost.remove(); };
    };
  }
  prog();
}
function finishLabels(g, items) {
  const sec = Math.round((Date.now() - g.t0) / 1000), pct = Math.round(100 * (items.length - g.wrongItems.size) / items.length);
  saveBest('labels:' + g.set, pct); window.G = null; MS.onPick = null;
  if (pct >= 80) { Snd.play('win'); confetti(); }
  setTimeout(() => {
    panel().innerHTML = `<div class="result"><div class="eyebrow">Kontuurkaart · ${SET_NAME[g.set]}</div><div class="grade">${pct}%</div><h2>${cheer(pct)}</h2>
      <div class="stat"><div><b>${g.mistakes}</b><span>viga</span></div><div><b>${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}</b><span>aega</span></div></div>
      <div class="row"><button class="btn" id="again">Uuesti</button><button class="btn ghost" id="menu">Teised mängud</button></div></div>`;
    $('#again').onclick = () => startLabels(g.set); $('#menu').onclick = () => setTab('harjuta');
  }, 500);
}

/* ---------- Õpiku küsimused (lk 11) ---------- */
const BOOK = [
  { q: 'Millised ookeanid puutuvad vahetult kokku kõigi teiste ookeanidega?', layer: 'oc', multi: true, ans: ['oc:vaikne', 'oc:atlandi'],
    why: 'Vaikne ja Atlandi ookean puutuvad kokku kõigi nelja teise ookeaniga. India ookean ei ulatu Põhja-Jäämereni, Lõuna-Jäämeri ei puutu Põhja-Jäämerega ja Põhja-Jäämeri puutub ainult Atlandi ja Vaikse ookeaniga.' },
  { q: 'Millist mandrit uhuvad vaid ühe ookeani veed?', layer: 'ct', ans: ['ct:antarktis'], why: 'Antarktist uhub ainult Lõuna-Jäämeri.' },
  { q: 'Millise mandri rannikut uhuvad nelja ookeani veed?', layer: 'ct', ans: ['ct:euraasia'], why: 'Euraasia rannikut uhuvad Põhja-Jäämeri, Atlandi, India ja Vaikne ookean.' },
  { q: 'Milline ookean ääristab kahte mandrit?', layer: 'oc', ans: ['oc:pohja-jaameri'], why: 'Põhja-Jäämeri ääristab Euraasiat ja Põhja-Ameerikat. Lõuna-Jäämeri ääristab ainult Antarktist, teised ookeanid kolme või nelja mandrit.' },
  { q: 'Mille poolest erinevad maailmajaod mandritest?', open: true }
];
const MODEL5 = 'Mandrid on looduslikult kujunenud suurimad maismaaosad, mida eraldavad maailmamere osad. Maailmajagude piirid on aga kokkuleppelised – nende aluseks on eelkõige ühiskondade kultuurilised ja ajaloolised eripärad. Seepärast võib maailmajagu hõlmata mandrit koos ümbritsevate saartega (Aafrika, Austraalia ja Okeaania, Antarktika), ainult osa mandrist (Euroopa ja Aasia) või isegi mitut mandrit (Ameerika).';
const CHECK5 = ['Mandrid on looduslikud maismaaosad, mida eraldab maailmameri.', 'Maailmajagude piirid on kokkuleppelised (kultuuri ja ajaloo põhjal).', 'Maailmajagu võib olla manner koos saartega, osa mandrist või mitu mandrit.', 'Tõin näite (nt Euraasia → Euroopa ja Aasia; Ameerika = kaks mandrit).'];
let BOOKSTATE = store.get('book', {});
function renderBook() {
  setTools({}); stopGame(); resetMapState('oc'); MS.labels = true; MS.onPick = null; paint();
  hint('Vali küsimus ja vasta kaardil.');
  panel().innerHTML = `<div><div class="eyebrow">Õpik lk 11</div><h2>Õpiku küsimused</h2></div><div class="book">${BOOK.map((b, i) => `<div class="bq${BOOKSTATE[i] ? ' solved' : ''}" id="bq${i}"><div class="q">${i + 1}. ${esc(b.q)}</div><div class="bbody"></div><div class="row"><button class="btn sm" data-a="${i}">${b.open ? 'Vasta' : 'Vasta kaardil'}</button><button class="btn ghost sm" data-s="${i}">Näita vastust</button>${BOOKSTATE[i] ? '<span class="muted">✓ lahendatud</span>' : ''}</div></div>`).join('')}</div>`;
  for (const b of $$('[data-a]', panel())) b.onclick = () => openBook(+b.dataset.a, false);
  for (const b of $$('[data-s]', panel())) b.onclick = () => openBook(+b.dataset.s, true);
}
function solveBook(i) { BOOKSTATE[i] = true; store.set('book', BOOKSTATE); const c = $('#bq' + i); if (c) c.classList.add('solved'); }
function openBook(i, reveal) {
  const b = BOOK[i], card = $('#bq' + i), body = $('.bbody', card);
  for (const o of $$('.bbody', panel())) if (o !== body) o.innerHTML = '';
  if (b.open) return openBook5(card, body, reveal);
  resetMapState(b.layer); MS.labels = false; MS.neutral = !!b.multi; paint();
  const showAns = ok => {
    MS.neutral = false; MS.focus = b.ans; MS.cls = {}; for (const k of b.ans) MS.cls[k] = 'ok'; MS.fills = {}; paint(); MS.onPick = null;
    const A = b.ans.map(nm).join(' ja ');
    body.innerHTML = fbHTML(ok !== false, `<b>${ok === false ? 'Mitte päris. Õige vastus: ' + A + '.' : ok ? 'Õige! ' + A + '.' : 'Vastus: ' + A + '.'}</b><span>${esc(b.why)}</span>`);
  };
  if (reveal) return showAns(null);
  card.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  if (!b.multi) {
    body.innerHTML = `<div class="note">Puuduta kaardil ${b.layer === 'oc' ? 'ookeani' : 'mandrit'}.</div>`; hint(`Küsimus ${i + 1}: puuduta kaardil.`);
    MS.onPick = (e, ks, key) => {
      if (!key.startsWith(b.layer + ':')) return;
      const ok = b.ans.includes(key);
      if (ok) { Snd.play('ok'); solveBook(i); showAns(true); }
      else { Snd.play('bad'); flash([key], 'bad', 800); body.innerHTML = fbHTML(false, `<b>${esc(nm(key))} – vale.</b><span>Mõtle veel: ${i === 1 ? 'mitu ookeani uhub seda mandrit?' : i === 2 ? 'kas ookeane on selle mandri ümber rohkem?' : 'mitut mandrit see ookean puudutab?'} Proovi uuesti.</span>`); }
    };
    return;
  }
  const picks = new Set();
  body.innerHTML = `<div class="note">Puuduta kaardil kõiki sobivaid ookeane, siis vajuta „Kontrolli“.</div><div class="row"><button class="btn sm" id="bk">Kontrolli</button></div>`;
  hint(`Küsimus ${i + 1}: vali ookeanid.`);
  MS.onPick = (e, ks, key) => { if (!key.startsWith('oc:')) return; Snd.play('tap'); if (picks.has(key)) { picks.delete(key); delete MS.fills[key]; } else { picks.add(key); MS.fills[key] = colorOf(key); } paint(); };
  $('#bk', body).onclick = () => {
    const ok = picks.size === b.ans.length && b.ans.every(k => picks.has(k));
    Snd.play(ok ? 'ok' : 'bad'); if (ok) solveBook(i); showAns(ok);
  };
}
function openBook5(card, body, reveal) {
  resetMapState('wp'); MS.labels = true; paint(); MS.onPick = null; hint('Vihje: vaheta kaarti mandrite ja maailmajagude vahel – mis muutub?');
  const draft = store.get('ans5', '');
  body.innerHTML = `<textarea id="a5" placeholder="Kirjuta oma vastus siia…" aria-label="Sinu vastus">${esc(draft)}</textarea>
    <div class="row"><button class="btn ghost sm" id="sw">Võrdle kaarte</button><button class="btn sm ai-only" id="aiCheck">Lase Claude’il kontrollida</button></div>
    <div id="ai5" class="ai" hidden></div>
    <div><b>Kontrolli ise: kas su vastuses on…</b><ul class="check" style="margin-top:8px">${CHECK5.map((c, j) => `<li><label><input type="checkbox" id="c5${j}">${esc(c)}</label></li>`).join('')}</ul></div>
    <div id="m5"${reveal ? '' : ' hidden'} class="note"><b>Näidisvastus.</b> ${esc(MODEL5)}</div>
    ${reveal ? '' : '<div><button class="btn ghost sm" id="sh5">Näita näidisvastust</button></div>'}`;
  const ta = $('#a5', body); ta.oninput = () => store.set('ans5', ta.value);
  let lay = 'wp'; $('#sw', body).onclick = () => { lay = lay === 'wp' ? 'ct' : 'wp'; resetMapState(lay); MS.labels = true; paint(); $('#sw', body).textContent = lay === 'wp' ? 'Näita mandreid' : 'Näita maailmajagusid'; };
  $('#sw', body).textContent = 'Näita mandreid';
  const sh = $('#sh5', body); if (sh) sh.onclick = () => { $('#m5', body).hidden = false; sh.remove(); solveBook(4); };
  for (const j of CHECK5.keys()) $('#c5' + j, body).onchange = () => { if (CHECK5.every((_, k) => $('#c5' + k, body).checked)) solveBook(4); };
  $('#aiCheck', body).onclick = () => checkAnswer5(ta.value, $('#ai5', body), $('#aiCheck', body));
}
async function checkAnswer5(ans, out, btn) {
  ans = (ans || '').trim(); if (!SAMPLE) return;
  if (ans.length < 15) { out.hidden = false; out.textContent = 'Kirjuta enne pikem vastus – vähemalt üks-kaks lauset.'; return; }
  btn.disabled = true; out.hidden = false; out.textContent = 'Claude loeb su vastust…';
  const prompt = `${AI_RULES}\nÕpilane vastas õpiku küsimusele „Mille poolest erinevad maailmajaod mandritest?“\nHea vastuse põhipunktid: (1) mandrid on looduslikult kujunenud suurimad maismaaosad, mida eraldavad maailmamere osad; (2) maailmajagude piirid on kokkuleppelised ja nende aluseks on ühiskondade kultuurilised ja ajaloolised eripärad; (3) maailmajagu võib hõlmata mandrit koos ümbritsevate saartega (Aafrika, Austraalia ja Okeaania, Antarktika), ainult osa mandrist (Euroopa, Aasia) või mitut mandrit (Ameerika).\nÕpilase vastus: """${ans.slice(0, 1500)}"""\nHinda vastust lahkelt, aga ausalt. Vasta ainult JSON-objektiga kujul {"tase": "väga hea" | "hea" | "vajab täiendamist", "olemas": ["..."], "puudu": ["..."], "tagasiside": "..."}. "olemas" ja "puudu" on lühikesed eestikeelsed punktid (0–3 tükki), "tagasiside" on 1–2 julgustavat lauset sina-vormis korrektses eesti keeles.`;
  try {
    const r = await SAMPLE.json(prompt, { cache: false });
    const li = a => (Array.isArray(a) && a.length ? `<ul class="facts">${a.slice(0, 4).map(x => `<li>${esc(String(x))}</li>`).join('')}</ul>` : '');
    out.innerHTML = `<b>Claude’i hinnang: ${esc(String(r.tase || ''))}</b>${r.olemas && r.olemas.length ? '<span>Hästi:</span>' + li(r.olemas) : ''}${r.puudu && r.puudu.length ? '<span>Lisa veel:</span>' + li(r.puudu) : ''}<span>${esc(String(r.tagasiside || ''))}</span>`;
    if (r.tase === 'väga hea') solveBook(4);
  } catch (e) { if (!aiGone(e.code)) out.textContent = aiErr(e.code); else out.hidden = true; }
  finally { btn.disabled = false; }
}

/* ---------- Kontrolltöö ---------- */
const gradeOf = p => (p >= 90 ? 5 : p >= 75 ? 4 : p >= 50 ? 3 : p >= 20 ? 2 : 1);
const GRADE_WORD = { 5: 'Suurepärane!', 4: 'Väga hea!', 3: 'Rahuldav – harjuta veel.', 2: 'Kordamine on vajalik.', 1: 'Alusta harjutustega.' };
function renderTest() {
  setTools({}); resetMapState('wp'); MS.labels = true; MS.onPick = null; paint(); hint('');
  const hist = store.get('tests', []);
  panel().innerHTML = `<div><div class="eyebrow">Kontrolltöö</div><h2>Proovi, kas oled valmis</h2></div>
    <p style="margin:0">15 küsimust kõigist teemadest: kaart, nimed, õigekiri, mõisted ja suurused. Nagu päris kontrolltöös, ei näe sa vastuste õigsust kohe – tulemuse ja vead näed lõpus.</p>
    <div class="note">Hinne: 90% → 5, 75% → 4, 50% → 3, 20% → 2.</div>
    <div><button class="btn" id="go">Alusta kontrolltööd</button></div>
    ${hist.length ? `<div><h3>Varasemad tulemused</h3><ul class="facts" style="margin-top:8px">${hist.slice(-5).reverse().map(h => `<li>${esc(h.d)} – hinne <b>${h.g}</b> (${h.p}%)</li>`).join('')}</ul></div>` : ''}`;
  $('#go').onclick = startTest;
}
function startTest() {
  const keys = shuffle(ITEMS.map(i => i.key));
  const qs = [
    ...keys.slice(0, 5).map(k => ({ kind: 'find', key: k })), ...keys.slice(5, 8).map(k => ({ kind: 'name', key: k })), ...keys.slice(8, 10).map(k => ({ kind: 'spell', key: k })),
    ...shuffle(TERMS).slice(0, 2).map(t => ({ kind: 'terms', term: t, key: TERM_KEY[t[0]] })),
    ...shuffle(neighborQuestions()).slice(0, 2).map(q => Object.assign({ kind: 'neighbors' }, q))
  ];
  const all = shuffle(qs); all.splice(7, 0, { kind: 'order', set: Math.random() < 0.5 ? 'oc' : 'wp' });
  runQuiz({ id: 'test', title: 'Kontrolltöö', questions: all, requeue: false, silent: true, onDone: finishTest });
}
function finishTest(g, pct) {
  const gr = gradeOf(pct); window.G = null; MS.onPick = null; resetMapState('wp'); MS.labels = true; paint(); hint('');
  const hist = store.get('tests', []); const d = new Date();
  hist.push({ d: d.toLocaleDateString('et-EE') + ' ' + d.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' }), p: pct, g: gr }); store.set('tests', hist.slice(-20));
  if (gr >= 4) { Snd.play('win'); confetti(); }
  const wrong = g.log.filter(x => !x.ok).map(x => x.q);
  panel().innerHTML = `<div class="result"><div class="eyebrow">Kontrolltöö tulemus</div><div class="row" style="align-items:flex-end;gap:16px"><div class="grade">${gr}</div><div><h2>${GRADE_WORD[gr]}</h2><div class="muted">${pct}% · õigeid ${g.first}/${g.total}</div></div></div>
    ${wrong.length ? `<div><h3>Vead ja õiged vastused</h3><ul class="facts" style="margin-top:8px">${wrong.map(q => `<li>${esc(qLabel(q))}</li>`).join('')}</ul></div>` : '<p style="margin:0">Ühtegi viga – tubli!</p>'}
    <div class="row"><button class="btn" id="again">Uus kontrolltöö</button>${wrong.some(q => q.key && BY[q.key]) ? '<button class="btn ghost" id="fix">Harjuta vigu</button>' : ''}</div></div>`;
  $('#again').onclick = startTest;
  const fx = $('#fix'); if (fx) fx.onclick = () => { const ks = [...new Set(wrong.filter(q => q.key && BY[q.key]).map(q => q.key))]; runQuiz({ id: null, title: 'Vigade parandus', questions: shuffle(ks).map(k => ({ kind: 'find', key: k })), restart: () => fx.onclick() }); };
}

/* ---------- Minu edu ---------- */
function weakQuiz() {
  const weak = shuffle(ITEMS).sort((a, b) => starsOf(a.key) - starsOf(b.key)).slice(0, 6);
  runQuiz({ id: null, title: 'Nõrgemad kohad', questions: shuffle(weak).map((i, j) => ({ kind: j % 2 ? 'name' : 'find', key: i.key })), restart: weakQuiz });
}
function levelName(n) { return n >= 45 ? 'Geograafiaproff' : n >= 30 ? 'Kaardimeister' : n >= 15 ? 'Maadeavastaja' : n >= 5 ? 'Teejuht' : 'Algaja rändur'; }
function renderProgress() {
  setTools({}); resetMapState('ct'); MS.labels = true; MS.onPick = null;
  MS.neutral = true; for (const it of ITEMS.filter(i => i.type === 'ct')) if (starsOf(it.key) >= 2) MS.fills[it.key] = colorOf(it.key);
  paint(); hint('Kaardil on värvilised need mandrid, mille kohta oled kogunud vähemalt kaks tähte.');
  const n = totalStars(), hist = store.get('tests', []);
  const group = t => `<div><h3>${TYPE_PLURAL[t]}</h3><div class="mastery" style="margin-top:8px">${ofType(t).map(i => { const r = PROG[i.key] || { ok: 0, bad: 0 }; return `<div class="mcard"><b>${esc(i.name)}</b>${starHTML(starsOf(i.key))}<span class="muted" style="font-size:12px">õigeid ${r.ok} · vigu ${r.bad}</span></div>`; }).join('')}</div></div>`;
  panel().innerHTML = `<div><div class="eyebrow">Minu edu</div><h2>${levelName(n)}</h2><p class="muted" style="margin:4px 0 0">${n} tähte 51-st</p></div>
    <div class="row"><button class="btn" id="weak">Harjuta nõrgemaid</button></div>
    ${group('ct')}${group('wp')}${group('oc')}
    ${hist.length ? `<div><h3>Kontrolltööd</h3><ul class="facts" style="margin-top:8px">${hist.slice(-5).reverse().map(h => `<li>${esc(h.d)} – hinne <b>${h.g}</b> (${h.p}%)</li>`).join('')}</ul></div>` : ''}
    <hr class="sep"><div id="rs"><button class="btn ghost sm" id="reset">Alusta otsast (kustuta tähed)</button></div>`;
  $('#weak').onclick = weakQuiz;
  $('#reset').onclick = () => {
    $('#rs').innerHTML = '<div class="confirm"><span>Kas kustutada kõik tähed ja tulemused?</span><button class="btn sm" id="yes" style="background:var(--bad);color:#fff">Jah, kustuta</button><button class="btn ghost sm" id="no">Ei</button></div>';
    $('#no').onclick = renderProgress;
    $('#yes').onclick = () => { for (const k of Object.keys(PROG)) delete PROG[k]; for (const k of Object.keys(BEST)) delete BEST[k]; store.set('progress', PROG); store.set('best', BEST); store.set('tests', []); BOOKSTATE = {}; store.set('book', {}); updateStars(); renderProgress(); };
  };
}

/* ---------- Käivitus ---------- */
function init() {
  buildMap(); initMapInput(); setVB(0, 0, MD.w); updateStars(); soundIcon();
  $('#soundBtn').onclick = () => { Snd.on = !Snd.on; store.set('sound', Snd.on); soundIcon(); Snd.play('tap'); };
  for (const b of $$('.tab')) b.onclick = () => setTab(b.dataset.tab);
  for (const b of $$('#layerSeg button')) b.onclick = () => switchLayer(b.dataset.layer);
  $('#tLabels').onclick = () => { MS.labels = !MS.labels; store.set('labels', MS.labels); $('#tLabels').setAttribute('aria-pressed', String(MS.labels)); drawLabels(); };
  $('#tLines').onclick = () => { MS.lines = !MS.lines; store.set('lines', MS.lines); $('#tLines').setAttribute('aria-pressed', String(MS.lines)); paint(); };
  const h = location.hash.slice(1);
  setTab(['avasta', 'harjuta', 'opik', 'test', 'edu'].includes(h) ? h : store.get('tab', 'avasta'));
  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('sample').then(s => { if (s) { SAMPLE = s; document.body.classList.add('has-ai'); } }).catch(() => {});
  }
}
init();
