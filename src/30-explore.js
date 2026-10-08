/* ---------- Kest: vahelehed ja tööriistad ---------- */
let TAB = 'avasta', SEL = null, SAMPLE = null;
const panel = () => $('#panel');
function setTools({ layers = false, labels = false } = {}) {
  $('#layerSeg').hidden = !layers; $('#tgl').hidden = !labels;
  $('.tools').classList.toggle('off', !layers && !labels);
}
function stopGame() { if (window.G && G.timer) clearTimeout(G.timer); window.G = null; }
function setTab(t) {
  stopGame(); TAB = t; store.set('tab', t);
  for (const b of $$('.tab')) b.setAttribute('aria-selected', String(b.dataset.tab === t));
  MS.explore = t === 'avasta'; setHover(null); $('#tip').classList.remove('on');
  ({ avasta: renderExplore, harjuta: renderPractice, opik: renderBook, test: renderTest, edu: renderProgress })[t]();
}
function chip(key, extra = '') {
  return `<button class="chip" data-go="${key}"><span class="dot" style="background:${colorOf(key)}"></span>${esc(nm(key))}${extra}</button>`;
}
function bindGo(root, fn) { for (const b of $$('[data-go]', root)) b.onclick = () => fn(b.dataset.go); }
function barsHTML(type) {
  const list = ofType(type).slice().sort((a, b) => b.area - a.area); const max = list[0].area;
  return `<div class="bars">${list.map(i => `<div class="barrow"><span>${esc(i.name)}</span><i style="width:${(100 * i.area / max).toFixed(1)}%;background:${colorOf(i.key)}"></i><b>${fmt(i.area)}</b></div>`).join('')}</div>`;
}
function pairsHTML() {
  const rows = [[['ct:euraasia'], ['wp:euroopa', 'wp:aasia']], [['ct:aafrika'], ['wp:aafrika']], [['ct:pohja-ameerika', 'ct:louna-ameerika'], ['wp:ameerika']], [['ct:austraalia'], ['wp:austraalia-okeaania']], [['ct:antarktis'], ['wp:antarktika']]];
  const cell = ks => `<div class="chips">${ks.map(k => chip(k)).join('')}</div>`;
  return `<div class="pairs"><span class="eyebrow">Manner</span><span></span><span class="eyebrow">Maailmajagu</span>${rows.map(([a, b]) => cell(a) + '<span class="arrow">→</span>' + cell(b)).join('')}</div>`;
}
function tricksHTML() { return `<div class="trick">${TRICKS.map(t => `<details><summary>${esc(t.t)}</summary><p>${t.p}</p></details>`).join('')}</div>`; }

/* ---------- Avasta ---------- */
function renderExplore() {
  setTools({ layers: true, labels: true });
  MS.labels = store.get('labels', true); MS.lines = store.get('lines', true);
  $('#tLabels').setAttribute('aria-pressed', String(MS.labels)); $('#tLines').setAttribute('aria-pressed', String(MS.lines));
  resetMapState(store.get('layer', 'ct'));
  MS.onPick = (e, ks, key) => {
    Snd.play('tap');
    if (BY[key]) return select(key);
    if (key.startsWith('isl:')) return showIsland(e);
    if (key === 'lake:kaspia') return showLake();
    select(null);
  };
  hint('Puuduta kaarti: näed nime ja fakte. Suurendamiseks kasuta nuppe + ja −.');
  if (SEL && BY[SEL] && BY[SEL].type === MS.layer) select(SEL); else { SEL = null; drawExplorePanel(); }
}
function switchLayer(l) {
  MS.layer = l; store.set('layer', l); SEL = null; resetMapState(l);
  if (TAB === 'avasta') renderExplore();
}
function select(key) {
  SEL = key;
  if (key && BY[key].type !== MS.layer) { MS.layer = BY[key].type; store.set('layer', MS.layer); syncLayerSeg(); }
  MS.focus = key ? [key] : null; MS.cls = {}; paint();
  drawExplorePanel();
}
function drawExplorePanel() {
  const p = panel();
  if (!SEL) {
    const L = MS.layer, d = DEFS[L];
    p.innerHTML = `<div><div class="eyebrow">${{ ct: '6 mandrit', wp: '6 maailmajagu', oc: '5 ookeani' }[L]}</div><h2>${d.title}</h2></div>
      <p style="margin:0">${d.text}</p>
      <div class="chips">${ofType(L).map(i => chip(i.key)).join('')}</div>
      <div class="note">${d.hint}</div>
      ${L === 'ct' ? `<div><h3>Suuruse järjekord</h3><ol class="facts" style="margin-top:8px">${ofType('ct').map(i => `<li>${esc(i.name)}</li>`).join('')}</ol></div>` : ''}
      ${L !== 'ct' ? `<div><h3>${L === 'oc' ? 'Pindala' : 'Maismaa pindala'}, mln km²</h3><div style="margin-top:10px">${barsHTML(L)}</div></div>` : ''}
      ${L === 'wp' ? `<div><h3>Kumb on kumb?</h3><p class="muted" style="margin:6px 0 10px">Maailmajagu võib olla manner koos saartega, osa mandrist või isegi mitu mandrit.</p>${pairsHTML()}</div>` : ''}
      <div><h3>Meeldejätmise nipid</h3><div style="margin-top:10px">${tricksHTML()}</div></div>`;
    bindGo(p, select); return;
  }
  const it = BY[SEL], n = ofType(it.type).length;
  const rankTxt = (it.rank === 1 ? 'Suurim' : it.rank === n ? 'Väikseim' : `Suuruselt ${it.rank}.`) + (n === 6 ? ' kuuest' : ' viiest');
  let rel = '';
  if (it.type === 'ct') rel = `<div><h3>Rannikut uhuvad</h3><div class="chips" style="margin-top:8px">${it.oceans.map(o => chip('oc:' + o)).join('')}</div></div>
    <div><h3>Maailmajagu</h3><div class="chips" style="margin-top:8px">${it.wps.map(w => chip('wp:' + w)).join('')}</div></div>`;
  if (it.type === 'wp') rel = `<div><h3>Hõlmab: ${KIND[it.kind]}</h3><div class="chips" style="margin-top:8px">${it.cts.map(c => chip('ct:' + c)).join('')}</div></div>`;
  if (it.type === 'oc') rel = `<div><h3>Ääristab mandreid</h3><div class="chips" style="margin-top:8px">${it.cts.map(c => chip('ct:' + c)).join('')}</div></div>
    <div><h3>Puutub kokku ookeanidega</h3><div class="chips" style="margin-top:8px">${it.ocs.map(o => chip('oc:' + o)).join('')}</div></div>`;
  panel().innerHTML = `<div class="row" style="justify-content:space-between"><span class="type">${TYPE_NAME[it.type]}</span><button class="btn ghost sm" id="closeSel">Kõik ${TYPE_PLURAL[it.type].toLowerCase()}</button></div>
    <div><div class="big">${esc(it.name)}</div><div class="muted" style="margin-top:4px">${rankTxt}</div></div>
    ${it.area ? `<div class="stat"><div><b>${fmt(it.area)}</b><span>mln km²${it.type === 'wp' ? ' maismaad' : ''}</span></div><div><b>${Math.round(100 * it.area / (it.type === 'oc' ? 335.2 : LAND_TOTAL))}%</b><span>${it.type === 'oc' ? 'ookeanide pindalast' : 'kogu maismaast'}</span></div></div>` : ''}
    <ul class="facts">${it.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    ${rel}
    <div class="row"><span class="muted">Sinu tähed:</span> ${starHTML(starsOf(it.key))}</div>
    <div class="ai ai-only"><b>Küsi Claude’ilt</b><div class="row" style="flex-wrap:nowrap"><input class="inp" id="aiQ" style="font-size:15px;padding:9px 11px" placeholder="Kirjuta oma küsimus…" maxlength="300"><button class="btn sm" id="aiGo">Küsi</button></div><div id="aiA" hidden></div></div>`;
  $('#closeSel').onclick = () => select(null);
  bindGo(panel(), select);
  const go = () => askTutor($('#aiQ').value, it, $('#aiA'), $('#aiGo'));
  $('#aiGo').onclick = go; $('#aiQ').onkeydown = e => { if (e.key === 'Enter') go(); };
}
function showIsland(e) {
  const n = e.dataset.isl, wp = e.dataset.wp; SEL = null;
  MS.focus = n ? ['isl:' + n] : null; MS.cls = {}; paint();
  panel().innerHTML = `<div class="row"><span class="type">saar</span></div>
    <div class="big">${n ? esc(n) : 'Saar'}</div>
    ${ISLAND_INFO[n] ? `<p style="margin:0"><b>${esc(ISLAND_INFO[n])[0].toUpperCase() + esc(ISLAND_INFO[n]).slice(1)}.</b></p>` : ''}
    <div class="note">Saar ei ole manner, seepärast on see mandrite kaardil hall. Maailmajagude hulka kuuluvad aga ka saared: see saar kuulub maailmajakku <b>${esc(WP_NAME[wp])}</b>.</div>
    <div class="row"><button class="btn" data-go="wp:${wp}">Vaata maailmajagu ${esc(WP_NAME[wp])}</button><button class="btn ghost" id="back">Tagasi</button></div>`;
  bindGo(panel(), select); $('#back').onclick = () => select(null);
}
function showLake() {
  SEL = null; MS.focus = null; MS.cls = { 'lake:kaspia': 'hl' }; paint();
  panel().innerHTML = `<div class="row"><span class="type">järv</span></div><div class="big">Kaspia meri</div>
    <p style="margin:0">Nimest hoolimata on Kaspia meri tegelikult <b>maailma suurim järv</b>. See ei ole ühenduses maailmamerega, seepärast ei kuulu see ühegi ookeani juurde.</p>
    <p style="margin:0" class="muted">Kaspia meri asub Euroopa ja Aasia piiril.</p><div><button class="btn ghost" id="back">Tagasi</button></div>`;
  $('#back').onclick = () => { MS.cls = {}; select(null); };
}

/* ---------- Claude kui abiõpetaja (kui vaataja lubab) ---------- */
const AI_RULES = 'Sa oled sõbralik ja täpne geograafiaõpetaja. Vastad umbes 11–14-aastasele õpilasele korrektses eesti keeles, sina-vormis. Teema: mandrid, ookeanid ja maailmajaod. Õpiku põhimõisted: mandreid on kuus (Euraasia, Aafrika, Põhja-Ameerika, Lõuna-Ameerika, Austraalia, Antarktis); ookeane on viis (Vaikne ookean, Atlandi ookean, India ookean, Lõuna-Jäämeri, Põhja-Jäämeri); maailmajagusid on kuus (Euroopa, Aasia, Aafrika, Ameerika, Austraalia ja Okeaania, Antarktika). Maailmajagude piirid on kokkuleppelised; maailmajagu hõlmab mandrit koos saartega, osa mandrist või mitut mandrit.';
function aiErr(code) {
  return code === 'rate_limited' ? 'Claude on praegu hõivatud. Proovi natukese aja pärast uuesti.'
    : code === 'session_expired' ? 'Logi uuesti sisse ja proovi siis uuesti.'
    : code === 'refused' ? 'Selle küsimusega Claude aidata ei saa. Küsi teisiti.' : 'Vastust ei tulnud. Proovi uuesti.';
}
function aiGone(code) {
  if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) { SAMPLE = null; document.body.classList.remove('has-ai'); return true; }
  return false;
}
async function askTutor(q, it, out, btn) {
  q = (q || '').trim(); if (!SAMPLE || !q) return;
  btn.disabled = true; out.hidden = false; out.textContent = 'Mõtlen…';
  const prompt = `${AI_RULES}\nÕpilane vaatab kaardil: ${it ? it.name + ' (' + TYPE_NAME[it.type] + ')' : 'maailmakaarti'}.\nÕpilase küsimus: """${q.slice(0, 300)}"""\nVasta lühidalt (kuni 4 lühikest lauset), lihtsalt ja faktiliselt täpselt. Kui sa pole milleski kindel, ütle seda. Kui küsimus ei puuduta geograafiat ega loodust, suuna sõbralikult tagasi kaardi juurde. Ära kasuta Markdowni.`;
  try { await SAMPLE(prompt, { modelTier: 'quick', onText: ({ text }) => { out.textContent = text; } }); }
  catch (e) { if (!aiGone(e.code)) out.textContent = e.text || aiErr(e.code); }
  finally { btn.disabled = false; }
}
