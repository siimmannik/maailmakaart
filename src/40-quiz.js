/* ---------- Küsimuste tüübid ---------- */
const TYPE_GEN = { ct: 'mandri', wp: 'maailmajao', oc: 'ookeani' };
const TERM_KEY = { 'Euraasia': 'ct:euraasia', 'Euroopa': 'wp:euroopa', 'Aasia': 'wp:aasia', 'Aafrika': 'wp:aafrika', 'Põhja-Ameerika': 'ct:pohja-ameerika', 'Lõuna-Ameerika': 'ct:louna-ameerika', 'Ameerika': 'wp:ameerika', 'Austraalia': 'ct:austraalia', 'Austraalia ja Okeaania': 'wp:austraalia-okeaania', 'Antarktis': 'ct:antarktis', 'Antarktika': 'wp:antarktika' };
const fbHTML = (ok, html) => `<div class="fb ${ok ? 'ok' : 'bad'}">${html}</div>`;
function whatIs(key) {
  if (key.startsWith('isl:')) return `See on saar${key.length > 4 ? ' ' + esc(key.slice(4)) : ''} – saar ei ole manner.`;
  if (key === 'lake:kaspia') return 'See on Kaspia meri – tegelikult järv.';
  return `See on ${esc(nm(key))}.`;
}
function showTarget(it) { resetMapState(it.type); MS.labels = false; MS.neutral = true; MS.fills = { [it.key]: 'var(--target)' }; MS.cls = { [it.key]: 'hl' }; paint(); }
const QK = {};
QK.find = (q, box, done) => {
  const it = BY[q.key]; resetMapState(it.type); MS.labels = false; MS.neutral = true; paint();
  box.innerHTML = `<div><div class="eyebrow">${TYPE_NAME[it.type]}</div><div class="prompt" style="margin-top:4px">Näita kaardil: <em>${esc(it.name)}</em></div></div><div id="fb"></div>`;
  hint(it.type === 'oc' ? 'Puuduta kaardil õiget ookeani.' : 'Puuduta kaardil õiget kohta.');
  let over = false;
  MS.onPick = (e, ks, key) => {
    if (over) return;
    if (key === 'sea' || key === 'land') { $('#fb', box).innerHTML = `<div class="note">${key === 'sea' ? 'See on meri. Otsi maismaad.' : 'See on maismaa. Otsi ookeani.'}</div>`; return; }
    over = true; const ok = key === it.key;
    if (q.silent) { flash([key], 'hov', 350); return done(ok); }
    if (ok) { flash([it.key], 'ok', 900); $('#fb', box).innerHTML = fbHTML(true, `<b>Õige!</b>`); }
    else { MS.fills = { [it.key]: 'var(--target)' }; MS.cls = { [key]: 'bad', [it.key]: 'hl' }; paint(); $('#fb', box).innerHTML = fbHTML(false, `<b>Vale.</b><span>${whatIs(key)} Õige koht vilgub kaardil.</span>`); }
    done(ok);
  };
};
QK.name = (q, box, done) => {
  const it = BY[q.key]; showTarget(it); MS.onPick = null;
  const opts = shuffle([it, ...shuffle(ofType(it.type).filter(x => x !== it)).slice(0, 3)]);
  box.innerHTML = `<div class="prompt">Mis ${TYPE_NAME[it.type]} see on?</div><div class="opts">${opts.map(o => `<button class="opt" data-k="${o.key}">${esc(o.name)}</button>`).join('')}</div><div id="fb"></div>`;
  hint('Vaata kaardil vilkuvat ala.');
  for (const b of $$('.opt', box)) b.onclick = () => {
    const ok = b.dataset.k === it.key; $$('.opt', box).forEach(x => { x.disabled = true; });
    if (!q.silent) {
      b.classList.add(ok ? 'ok' : 'bad'); $(`.opt[data-k="${it.key}"]`, box).classList.add('ok');
      MS.cls = { [it.key]: ok ? 'ok' : 'hl' }; applyClasses();
      $('#fb', box).innerHTML = ok ? fbHTML(true, '<b>Õige!</b>') : fbHTML(false, `<b>Vale.</b><span>See on ${esc(it.name)}.</span>`);
    } else b.classList.add('ok');
    done(ok);
  };
};
function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
function spellCheck(raw, it) {
  const s = raw.trim().replace(/\s+/g, ' '), t = it.name;
  if (!s) return { level: 'empty' };
  if (s === t) return { level: 'exact', ok: true };
  if (it.short && s.toLowerCase() === it.short.toLowerCase()) return { level: 'short', ok: true };
  if (s.toLowerCase() === t.toLowerCase()) return { level: 'case', ok: true };
  const strip = x => x.toLowerCase().replace(/[-–\s]/g, '').replace(/õ|ö/g, 'o').replace(/ä/g, 'a').replace(/ü/g, 'u');
  if (strip(s) === strip(t)) return { level: 'marks', ok: false };
  if (lev(strip(s), strip(t)) <= 2) return { level: 'close', ok: false };
  return { level: 'wrong', ok: false, other: ITEMS.find(i => strip(i.name) === strip(s) || (i.short && strip(i.short) === strip(s))) };
}
QK.spell = (q, box, done) => {
  const it = BY[q.key]; showTarget(it); MS.onPick = null;
  box.innerHTML = `<div class="prompt">Kirjuta selle ${TYPE_GEN[it.type]} nimi</div>
    <input class="inp" id="sp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Nimi" aria-label="Nimi">
    <div class="keys">${['õ', 'ä', 'ö', 'ü', 'Õ', 'Ä', 'Ö', 'Ü', '-'].map(c => `<button data-c="${c}" type="button">${c}</button>`).join('')}</div>
    <div class="row"><button class="btn" id="spGo">Kontrolli</button></div><div id="fb"></div>`;
  hint('Vaata kaardil vilkuvat ala. Kirjuta nimi nii, nagu kirjutaksid kontrolltöös.');
  const inp = $('#sp', box); setTimeout(() => inp.focus({ preventScroll: true }), 60);
  for (const b of $$('.keys button', box)) b.onclick = () => { const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + b.dataset.c + inp.value.slice(inp.selectionEnd ?? p); inp.focus(); inp.setSelectionRange(p + 1, p + 1); };
  let over = false;
  const check = () => {
    if (over) return; const r = spellCheck(inp.value, it);
    if (r.level === 'empty') { inp.focus(); return; }
    over = true; inp.disabled = true; $('#spGo', box).disabled = true; $$('.keys button', box).forEach(b => { b.disabled = true; });
    if (!q.silent) {
      const N = `<b>${esc(it.name)}</b>`;
      const msg = {
        exact: fbHTML(true, '<b>Õige!</b><span>Kirjapilt on täpselt õige.</span>'),
        short: fbHTML(true, `<b>Õige!</b><span>Kontrolltöös kirjuta terve nimi: ${N}.</span>`),
        case: fbHTML(true, `<b>Peaaegu täpne!</b><span>Jälgi suur- ja väiketähti: ${N}.</span>`),
        marks: fbHTML(false, `<b>Peaaegu!</b><span>Õige kirjapilt on ${N} – vaata täpitähti ja sidekriipsu.</span>`),
        close: fbHTML(false, `<b>Peaaegu, aga sees on kirjaviga.</b><span>Õige: ${N}.</span>`),
        wrong: fbHTML(false, `<b>Vale.</b><span>${r.other ? esc(r.other.name) + ' on teises kohas. ' : ''}See on ${N}.</span>`)
      }[r.level];
      $('#fb', box).innerHTML = msg; MS.cls = { [it.key]: r.ok ? 'ok' : 'hl' }; applyClasses();
    }
    done(r.ok);
  };
  $('#spGo', box).onclick = check; inp.onkeydown = e => { if (e.key === 'Enter') check(); };
};
QK.terms = (q, box, done) => {
  const [term, ans, why] = q.term; resetMapState('ct'); MS.neutral = true; MS.labels = false; paint(); MS.onPick = null;
  box.innerHTML = `<div class="prompt">Mis on <em>${esc(term)}</em>?</div><div class="opts">${['ct', 'wp', 'both'].map(a => `<button class="opt" data-a="${a}">${TERM_LABEL[a]}</button>`).join('')}</div><div id="fb"></div>`;
  hint('Manner, maailmajagu või mõlemad?');
  for (const b of $$('.opt', box)) b.onclick = () => {
    const ok = b.dataset.a === ans; $$('.opt', box).forEach(x => { x.disabled = true; });
    if (!q.silent) {
      b.classList.add(ok ? 'ok' : 'bad'); $(`.opt[data-a="${ans}"]`, box).classList.add('ok');
      $('#fb', box).innerHTML = fbHTML(ok, `<b>${ok ? 'Õige!' : 'Vale.'}</b><span>${esc(why)}</span>`);
      const k = TERM_KEY[term]; resetMapState(k.split(':')[0]); MS.labels = false; MS.focus = [k]; MS.cls = { [k]: 'ok' }; paint();
    } else b.classList.add('ok');
    done(ok);
  };
};
QK.neighbors = (q, box, done) => {
  resetMapState(q.layer); MS.neutral = true; MS.labels = false; MS.fills = { [q.subject]: 'var(--target)' }; paint();
  const picks = new Set();
  box.innerHTML = `<div class="prompt" style="font-size:22px">${q.text}</div><div class="chips" id="picked"><span class="muted">Puuduta kaardil – valitud ilmuvad siia.</span></div><div class="row"><button class="btn" id="nbGo">Kontrolli</button></div><div id="fb"></div>`;
  hint(q.pickType === 'oc' ? 'Puuduta ookeane. Uus puudutus tühistab valiku.' : 'Puuduta mandreid. Uus puudutus tühistab valiku.');
  let over = false;
  const upd = () => { $('#picked', box).innerHTML = picks.size ? [...picks].map(k => chip(k)).join('') : '<span class="muted">Puuduta kaardil – valitud ilmuvad siia.</span>'; };
  MS.onPick = (e, ks, key) => {
    if (over || !key.startsWith(q.pickType + ':') || key === q.subject) return;
    Snd.play('tap');
    if (picks.has(key)) { picks.delete(key); delete MS.fills[key]; } else { picks.add(key); MS.fills[key] = colorOf(key); }
    paint(); upd();
  };
  $('#nbGo', box).onclick = () => {
    if (over) return; over = true;
    const miss = q.answer.filter(k => !picks.has(k)), extra = [...picks].filter(k => !q.answer.includes(k)), ok = !miss.length && !extra.length;
    $('#nbGo', box).disabled = true;
    if (!q.silent) {
      for (const k of q.answer) MS.fills[k] = colorOf(k);
      MS.cls = {}; for (const k of miss) MS.cls[k] = 'hl'; for (const k of extra) MS.cls[k] = 'bad'; paint();
      $('#fb', box).innerHTML = ok ? fbHTML(true, `<b>Õige!</b><span>${q.answer.map(nm).join(', ')}.</span>`)
        : fbHTML(false, `<b>Mitte päris.</b>${miss.length ? `<span>Puudu: ${miss.map(nm).join(', ')} (vilgub kaardil).</span>` : ''}${extra.length ? `<span>Üleliigne: ${extra.map(nm).join(', ')}.</span>` : ''}<span>Õige vastus: ${q.answer.map(nm).join(', ')}.</span>`);
    }
    done(ok);
  };
};
QK.order = (q, box, done) => {
  const type = q.set, truth = ofType(type).slice().sort((a, b) => b.area - a.area).map(i => i.key);
  resetMapState(type); MS.neutral = true; MS.labels = false; paint();
  const picked = []; let mistakes = 0;
  box.innerHTML = `<div class="prompt" style="font-size:22px">Puuduta ${type === 'oc' ? 'ookeane' : 'maailmajagusid'} suuruse järjekorras – alusta <em>suurimast</em>.</div>
    <div class="slots">${truth.map((_, i) => `<div class="slot" data-i="${i}"><span class="n">${i + 1}.</span><span></span><span class="muted"></span></div>`).join('')}</div><div id="fb"></div>`;
  hint(type === 'oc' ? 'Puuduta ookeane kaardil.' : 'Puuduta maailmajagusid kaardil.');
  const fill = (k, i) => { const s = $(`.slot[data-i="${i}"]`, box); s.classList.add('fill'); s.children[1].textContent = nm(k); s.children[2].textContent = q.silent ? '' : fmt(BY[k].area) + ' mln km²'; MS.fills[k] = colorOf(k); paint(); };
  MS.onPick = (e, ks, key) => {
    if (!key.startsWith(type + ':') || picked.includes(key) || picked.length === truth.length) return;
    if (q.silent) { fill(key, picked.length); picked.push(key); if (picked.length === truth.length) done(picked.every((k, i) => k === truth[i])); return; }
    if (key === truth[picked.length]) {
      fill(key, picked.length); picked.push(key); Snd.play('tap'); $('#fb', box).innerHTML = '';
      if (picked.length === truth.length) { const sc = Math.max(0, truth.length - mistakes) / truth.length; $('#fb', box).innerHTML = fbHTML(mistakes === 0, `<b>${mistakes ? 'Valmis! Vigu: ' + mistakes : 'Täiesti õige järjekord!'}</b><span>${type === 'oc' ? 'Meeldejätmiseks: V-A-I-L-P – „Vanaema Armastab Igal Laupäeval Pannkooke“.' : 'Viis kuuest algavad A-ga – ainult Euroopa mitte.'}</span>`); done(mistakes === 0, { score: sc, mistakes }); }
    } else {
      mistakes++; flash([key], 'bad', 700); Snd.play('bad');
      $('#fb', box).innerHTML = fbHTML(false, `<span>${esc(nm(key))} ei ole järgmine. Otsi suurimat allesjäänud ${type === 'oc' ? 'ookeani' : 'maailmajagu'}.</span>`);
    }
  };
};

/* ---------- Mängu juhtimine ---------- */
window.G = null;
function runQuiz(opt) {
  stopGame();
  const g = window.G = Object.assign({ qs: opt.questions.slice(), total: opt.questions.length, first: 0, answered: 0, missed: new Set(), wrongList: [], log: [], timer: null, requeue: true, silent: false }, opt);
  setTools({}); MS.explore = false; nextQ(g);
}
function nextQ(g) {
  if (window.G !== g) return;
  if (!g.qs.length) return finishQuiz(g);
  g.cur = g.qs.shift(); g.cur.silent = g.silent;
  const p = panel();
  p.innerHTML = `<div class="qhead"><div class="grow"><div class="eyebrow">${esc(g.title)}</div><div class="prog" style="margin-top:6px"><i style="width:${(100 * g.answered / g.total).toFixed(1)}%"></i></div></div><span class="muted" style="font-variant-numeric:tabular-nums">${Math.min(g.answered + 1, g.total)}/${g.total}</span><button class="btn ghost sm" id="quit">Lõpeta</button></div><div id="qbody" style="display:flex;flex-direction:column;gap:14px"></div>`;
  $('#quit').onclick = () => { stopGame(); setTab(TAB); };
  QK[g.cur.kind](g.cur, $('#qbody'), (ok, o = {}) => answered(g, ok, o));
}
function answered(g, ok, o) {
  if (window.G !== g) return;
  const q = g.cur, firstTime = !g.missed.has(q);
  g.log.push({ q, ok });
  if (g.silent) { if (ok) g.first++; else g.wrongList.push(q); if (q.key) rate(q.key, ok); g.answered++; g.timer = setTimeout(() => nextQ(g), 450); return; }
  if (ok || o.score != null) {
    if (firstTime) { g.first += o.score != null ? o.score : 1; if (q.key) rate(q.key, true); }
    if (o.mistakes != null) g.mistakes = o.mistakes;
    g.answered++; if (ok) Snd.play('ok');
    if (!ok || o.score != null) return addNext(g);
    g.timer = setTimeout(() => nextQ(g), 1000);
  } else {
    Snd.play('bad');
    if (firstTime) { g.missed.add(q); g.wrongList.push(q); if (q.key) rate(q.key, false); }
    if (g.requeue) g.qs.splice(Math.min(2, g.qs.length), 0, q); else g.answered++;
    addNext(g);
  }
}
function addNext(g) {
  const b = el(`<button class="btn">${g.qs.length ? 'Edasi →' : 'Vaata tulemust →'}</button>`);
  $('#qbody').append(b); b.focus({ preventScroll: true }); b.onclick = () => nextQ(g);
}
function cheer(pct) { return pct === 100 ? 'Suurepärane! Kõik esimese korraga õiged.' : pct >= 80 ? 'Väga hea!' : pct >= 50 ? 'Hea algus! Harjuta veel natuke.' : 'Harjutamine teeb meistriks – proovi uuesti!'; }
function qLabel(q) {
  if (q.kind === 'terms') return `Mis on „${q.term[0]}“? → ${TERM_LABEL[q.term[1]]}`;
  if (q.kind === 'neighbors') return q.text.replace(/<[^>]+>/g, '') + ' → ' + q.answer.map(nm).join(', ');
  if (q.kind === 'order') return `Suuruse järjekord: ${ofType(q.set).slice().sort((a, b) => b.area - a.area).map(i => i.name).join(', ')}`;
  const it = BY[q.key], t = TYPE_NAME[it.type];
  return q.kind === 'spell' ? `Õige kirjapilt: ${it.name}` : q.kind === 'name' ? `Kaardil vilkus ${t}: ${it.name}` : `Näita kaardil: ${it.name} (${t})`;
}
function finishQuiz(g) {
  const pct = Math.round(100 * g.first / g.total);
  if (g.id) saveBest(g.id, pct);
  if (g.onDone) return g.onDone(g, pct);
  MS.onPick = null; resetMapState(MS.layer); MS.labels = true; paint(); hint('');
  if (pct >= 80) { Snd.play('win'); confetti(); }
  panel().innerHTML = `<div class="result"><div class="eyebrow">${esc(g.title)}</div><div class="grade">${pct}%</div><h2>${cheer(pct)}</h2>
    <p class="muted" style="margin:0">${g.mistakes != null ? 'Vigu: ' + g.mistakes : 'Esimese korraga õigeid: ' + g.first + ' / ' + g.total}</p>
    ${g.wrongList.length ? `<div><h3>Need vajavad veel harjutamist</h3><ul class="facts" style="margin-top:8px">${g.wrongList.map(q => `<li>${esc(qLabel(q))}</li>`).join('')}</ul></div>` : ''}
    <div class="row"><button class="btn" id="again">Mängi uuesti</button><button class="btn ghost" id="menu">Teised mängud</button></div></div>`;
  $('#again').onclick = () => g.restart(); $('#menu').onclick = () => setTab('harjuta');
}

/* ---------- Harjuta: mängude menüü ---------- */
const SET_NAME = { ct: 'Mandrid', wp: 'Maailmajaod', oc: 'Ookeanid', all: 'Kõik', mix: 'Alusta' };
const GAMES = [
  { id: 'find', title: 'Leia kaardilt', desc: 'Nimi on antud – näita see kaardil.', sets: ['ct', 'wp', 'oc', 'all'] },
  { id: 'name', title: 'Mis see on?', desc: 'Kaardil vilgub ala – vali õige nimi.', sets: ['ct', 'wp', 'oc', 'all'] },
  { id: 'spell', title: 'Kirjuta nimi', desc: 'Nagu kontrolltöös: õige kirjapilt koos suurtähtede ja sidekriipsudega.', sets: ['ct', 'wp', 'oc', 'all'] },
  { id: 'labels', title: 'Kontuurkaart', desc: 'Lohista nimed tühjale kaardile õigesse kohta.', sets: ['ct', 'wp', 'oc', 'all'] },
  { id: 'order', title: 'Suuruse järjekord', desc: 'Puuduta kaardil suurimast väikseimani.', sets: ['oc', 'wp'] },
  { id: 'neighbors', title: 'Kes keda uhub?', desc: 'Millised ookeanid uhuvad mandrit? Millega ookean kokku puutub?', sets: ['mix'] },
  { id: 'terms', title: 'Manner või maailmajagu?', desc: 'Antarktis või Antarktika? Austraalia või Austraalia ja Okeaania?', sets: ['mix'] }
];
function makeQuestions(id, set) {
  const items = set === 'all' ? ITEMS : ofType(set);
  if (id === 'find' || id === 'name' || id === 'spell') return shuffle(items).map(i => ({ kind: id, key: i.key }));
  if (id === 'order') return [{ kind: 'order', set }];
  if (id === 'neighbors') return shuffle(neighborQuestions()).slice(0, 6).map(q => Object.assign({ kind: 'neighbors' }, q));
  if (id === 'terms') return shuffle(TERMS).map(t => ({ kind: 'terms', term: t, key: TERM_KEY[t[0]] }));
  return [];
}
function startGame(id, set) {
  const def = GAMES.find(x => x.id === id);
  if (id === 'labels') return startLabels(set);
  const restart = () => startGame(id, set);
  runQuiz({ id: id + ':' + set, title: def.title + (set !== 'mix' ? ' · ' + SET_NAME[set] : ''), questions: makeQuestions(id, set), requeue: id !== 'order' && id !== 'neighbors', restart });
}
function renderPractice() {
  setTools({}); resetMapState(MS.layer); MS.labels = true; MS.onPick = null; paint(); hint('Vali mäng. Iga õige vastus annab tähe – kokku saab koguda 51 tähte.');
  panel().innerHTML = `<div><div class="eyebrow">Harjuta</div><h2>Vali mäng</h2></div><div class="games">${GAMES.map(g => `<div class="game"><h3>${esc(g.title)}</h3><p>${esc(g.desc)}</p><div class="row sets">${g.sets.map(s => `<button data-g="${g.id}" data-s="${s}">${SET_NAME[s]}${BEST[g.id + ':' + s] != null ? ` <span class="best">${BEST[g.id + ':' + s]}%</span>` : ''}</button>`).join('')}</div></div>`).join('')}</div>`;
  for (const b of $$('[data-g]', panel())) b.onclick = () => startGame(b.dataset.g, b.dataset.s);
}
