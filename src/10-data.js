'use strict';
/* ---------- Teadmised (õpik lk 11 + üldtuntud faktid) ---------- */
const TYPE_NAME = { ct: 'manner', wp: 'maailmajagu', oc: 'ookean' };
const TYPE_PLURAL = { ct: 'Mandrid', wp: 'Maailmajaod', oc: 'Ookeanid' };
const ITEMS = [
  { type: 'ct', id: 'euraasia', name: 'Euraasia', rank: 1, oceans: ['pohja-jaameri', 'atlandi', 'india', 'vaikne'], wps: ['euroopa', 'aasia'],
    facts: ['Suurim manner. Sellel asub kaks maailmajagu: Euroopa ja Aasia.', 'Nimi on kokku pandud: EUR(oopa) + AASIA.', 'Ainus manner, mille rannikut uhuvad nelja ookeani veed.', 'Ka Eesti asub Euraasia mandril.'] },
  { type: 'ct', id: 'aafrika', name: 'Aafrika', rank: 2, oceans: ['atlandi', 'india'], wps: ['aafrika'],
    facts: ['Suuruselt teine manner.', 'Ainus manner, mida läbivad nii ekvaator kui ka mõlemad pöörijooned.', 'Aasiast eraldab Aafrikat Suessi kanal.'] },
  { type: 'ct', id: 'pohja-ameerika', name: 'Põhja-Ameerika', rank: 3, oceans: ['pohja-jaameri', 'atlandi', 'vaikne'], wps: ['ameerika'],
    facts: ['Suuruselt kolmas manner.', 'Lõuna-Ameerikaga ühendab seda kitsas Panama maakitsus.', 'Gröönimaa on maailma suurim saar. See ei ole mandri osa, kuid kuulub maailmajakku Ameerika.'] },
  { type: 'ct', id: 'louna-ameerika', name: 'Lõuna-Ameerika', rank: 4, oceans: ['atlandi', 'vaikne'], wps: ['ameerika'],
    facts: ['Suuruselt neljas manner.', 'Ekvaator läbib mandri põhjaosa.', 'Antarktisest eraldab seda Drake’i väin.'] },
  { type: 'ct', id: 'antarktis', name: 'Antarktis', rank: 5, oceans: ['louna-jaameri'], wps: ['antarktika'],
    facts: ['Suuruselt viies manner. Asub lõunapoolusel ja on peaaegu täielikult jääga kaetud.', 'Ainus manner, mida uhuvad vaid ühe ookeani – Lõuna-Jäämere – veed.', 'Alalisi elanikke ei ole, on ainult uurimisjaamad.', 'Pane tähele: manner on Antarktis, maailmajagu on Antarktika.'] },
  { type: 'ct', id: 'austraalia', name: 'Austraalia', rank: 6, oceans: ['india', 'vaikne'], wps: ['austraalia-okeaania'],
    facts: ['Väikseim manner.', 'Lõunapöörijoon läbib mandri keskosa.', 'Ainus manner, millel on ainult üks riik.'] },

  { type: 'wp', id: 'aasia', name: 'Aasia', area: 44.4, rank: 1, cts: ['euraasia'], kind: 'osa',
    facts: ['Suurim maailmajagu.', 'Hõlmab Euraasia mandri idaosa koos saartega (nt Jaapani saared, Sumatra, Kalimantan).', 'Siin asub maailma kõrgeim mägi Džomolungma (Everest).'] },
  { type: 'wp', id: 'ameerika', name: 'Ameerika', area: 42.1, rank: 2, cts: ['pohja-ameerika', 'louna-ameerika'], kind: 'mitu',
    facts: ['Suuruselt teine maailmajagu.', 'Ainus maailmajagu, mis hõlmab kaht mandrit: Põhja-Ameerika ja Lõuna-Ameerika (koos saartega).', 'Siia kuulub ka Gröönimaa.'] },
  { type: 'wp', id: 'aafrika', name: 'Aafrika', area: 29.9, rank: 3, cts: ['aafrika'], kind: 'saared',
    facts: ['Suuruselt kolmas maailmajagu.', 'Aafrika manner koos ümbritsevate saartega (nt Madagaskar).', 'Mandril ja maailmajaol on sama nimi.'] },
  { type: 'wp', id: 'antarktika', name: 'Antarktika', area: 13.9, rank: 4, cts: ['antarktis'], kind: 'saared',
    facts: ['Suuruselt neljas maailmajagu.', 'Antarktise manner koos ümbritsevate saartega.', 'Manner on Antarktis, maailmajagu Antarktika – pikem nimi, suurem ala.'] },
  { type: 'wp', id: 'euroopa', name: 'Euroopa', area: 10.2, rank: 5, cts: ['euraasia'], kind: 'osa',
    facts: ['Suuruselt viies maailmajagu – väiksem on ainult Austraalia ja Okeaania.', 'Hõlmab Euraasia mandri lääneosa koos saartega (nt Suurbritannia, Island).', 'Euroopa ja Aasia vahel ei ole ookeani. Piir on kokkuleppeline: tavaliselt loetakse piiriks Uurali mäestikku ja Uurali jõge, Kaspia merd ning Kaukaasia piirkonda.', 'Eesti asub Euroopas.'] },
  { type: 'wp', id: 'austraalia-okeaania', name: 'Austraalia ja Okeaania', area: 8.9, rank: 6, cts: ['austraalia'], kind: 'saared',
    facts: ['Väikseim maailmajagu.', 'Austraalia manner koos Vaikse ookeani tuhandete saartega (nt Uus-Guinea, Uus-Meremaa). Okeaania ongi saarte maailm.', 'Mandri nimi on lihtsalt Austraalia, maailmajao nimi on pikem.'] },

  { type: 'oc', id: 'vaikne', name: 'Vaikne ookean', short: 'Vaikne', area: 155.6, rank: 1, cts: ['euraasia', 'austraalia', 'pohja-ameerika', 'louna-ameerika'], ocs: ['atlandi', 'india', 'louna-jaameri', 'pohja-jaameri'],
    facts: ['Suurim ja sügavaim ookean.', 'Vaikne ookean on suurem kui kogu maailma maismaa kokku!', 'Sügavaim koht on Mariaani süvik (umbes 11 km).', 'Puutub kokku kõigi teiste ookeanidega.'] },
  { type: 'oc', id: 'atlandi', name: 'Atlandi ookean', short: 'Atlandi', area: 76.7, rank: 2, cts: ['euraasia', 'aafrika', 'pohja-ameerika', 'louna-ameerika'], ocs: ['vaikne', 'india', 'louna-jaameri', 'pohja-jaameri'],
    facts: ['Suuruselt teine ookean.', 'Eraldab Ameerikat Euroopast ja Aafrikast.', 'Läänemeri, mille ääres asub Eesti, on Atlandi ookeani osa.', 'Puutub kokku kõigi teiste ookeanidega.'] },
  { type: 'oc', id: 'india', name: 'India ookean', short: 'India', area: 68.6, rank: 3, cts: ['aafrika', 'euraasia', 'austraalia'], ocs: ['vaikne', 'atlandi', 'louna-jaameri'],
    facts: ['Suuruselt kolmas ookean.', 'Asub peamiselt lõunapoolkeral Aafrika, Aasia ja Austraalia vahel.', 'Kõige soojem ookean.', 'Ei puutu kokku Põhja-Jäämerega.'] },
  { type: 'oc', id: 'louna-jaameri', name: 'Lõuna-Jäämeri', area: 20.3, rank: 4, cts: ['antarktis'], ocs: ['vaikne', 'atlandi', 'india'],
    facts: ['Suuruselt neljas ookean.', 'Ümbritseb Antarktist – ainus ookean, mis ulatub ümber kogu maakera.', 'Ääristab ainult üht mandrit: Antarktist.'] },
  { type: 'oc', id: 'pohja-jaameri', name: 'Põhja-Jäämeri', area: 14.0, rank: 5, cts: ['euraasia', 'pohja-ameerika'], ocs: ['vaikne', 'atlandi'],
    facts: ['Väikseim ookean.', 'Asub põhjapooluse ümber ja on suure osa aastast jääga kaetud.', 'Ääristab kaht mandrit: Euraasiat ja Põhja-Ameerikat.', 'Puutub kokku ainult Atlandi ja Vaikse ookeaniga.'] }
];
ITEMS.forEach(it => { it.key = it.type + ':' + it.id; });
const BY = Object.fromEntries(ITEMS.map(i => [i.key, i]));
const ofType = t => ITEMS.filter(i => i.type === t);
const nm = key => BY[key] ? BY[key].name : key;
const colorOf = key => { const [t, id] = key.split(':'); return `var(--${t === 'ct' ? 'c' : t === 'wp' ? 'w' : 'o'}-${id})`; };
const LAND_TOTAL = 149.4; // õpiku maailmajagude maismaa pindalade summa

const DEFS = {
  ct: { title: 'Mandrid ehk kontinendid', text: 'Maakera suurimad maismaaosad, mis on kujunenud miljardeid aastaid kestnud looduslike protsesside tagajärjel. Mandreid on kuus.', hint: 'Hall värv = saared. Saar ei ole mandri osa, aga kuulub maailmajakku.' },
  wp: { title: 'Maailmajaod', text: 'Suured alad, mille piirid on kokkuleppelised. Piiritlemise aluseks on eelkõige neid alasid asustanud ühiskondade kultuurilised ja ajaloolised eripärad. Maailmajagusid on kuus.', hint: 'Maailmajagu = manner koos saartega, osa mandrist või isegi mitu mandrit.' },
  oc: { title: 'Ookeanid', text: 'Maailmamere suurimad osad. Maailmameri on katkematu üleilmne veeväli, mis eraldab mandreid; selle osad on ookeanid, mered ja väinad. Ookeane on viis.', hint: 'Kaspia meri ei kuulu maailmamerre – see on tegelikult maailma suurim järv.' }
};
const KIND = { saared: 'manner koos ümbritsevate saartega', osa: 'osa mandrist', mitu: 'mitu mandrit' };

const TRICKS = [
  { t: 'Ookeanid suuruse järjekorras', p: 'V-A-I-L-P: „<b>V</b>anaema <b>A</b>rmastab <b>I</b>gal <b>L</b>aupäeval <b>P</b>annkooke“ → Vaikne, Atlandi, India, Lõuna-Jäämeri, Põhja-Jäämeri.' },
  { t: 'Pikem nimi = maailmajagu', p: 'Antarktis on manner, Antarktika maailmajagu. Austraalia on manner, Austraalia ja Okeaania maailmajagu. Maailmajao nimi on pikem, sest sinna kuuluvad ka saared.' },
  { t: 'Üks manner – kaks maailmajagu', p: 'Euraasia = EUR + AASIA: üks manner, kaks maailmajagu. Ameerika on vastupidi: üks maailmajagu, kaks mandrit.' },
  { t: 'Viis A-d ja üks E', p: 'Maailmajaod suuruse järjekorras: Aasia, Ameerika, Aafrika, Antarktika, Euroopa, Austraalia ja Okeaania. Viis kuuest algavad A-ga – ainult Euroopa mitte.' },
  { t: 'Vaikne ookean on hiiglane', p: 'Vaikne ookean (155,6 mln km²) on suurem kui kõigi maailmajagude maismaa kokku (149,4 mln km²).' },
  { t: 'Jäämered poolustel', p: 'Kaks väikseimat ookeani on jäämered: Põhja-Jäämeri põhjapooluse ümber ja Lõuna-Jäämeri ümber Antarktise.' },
  { t: 'Mandrid suuruse järjekorras', p: 'Euraasia, Aafrika, Põhja-Ameerika, Lõuna-Ameerika, Antarktis, Austraalia.' }
];

// mõisted: manner / maailmajagu / mõlemad
const TERMS = [
  ['Euraasia', 'ct', 'Euraasia on manner. Sellel on kaks maailmajagu: Euroopa ja Aasia.'],
  ['Euroopa', 'wp', 'Euroopa on maailmajagu – Euraasia mandri lääneosa koos saartega.'],
  ['Aasia', 'wp', 'Aasia on maailmajagu – Euraasia mandri idaosa koos saartega.'],
  ['Aafrika', 'both', 'Aafrika on nii mandri kui ka maailmajao nimi.'],
  ['Põhja-Ameerika', 'ct', 'Põhja-Ameerika on manner. Koos Lõuna-Ameerikaga moodustab see maailmajao Ameerika.'],
  ['Lõuna-Ameerika', 'ct', 'Lõuna-Ameerika on manner. Koos Põhja-Ameerikaga moodustab see maailmajao Ameerika.'],
  ['Ameerika', 'wp', 'Ameerika on maailmajagu, mis hõlmab kaht mandrit.'],
  ['Austraalia', 'ct', 'Austraalia on manner. Maailmajao nimi on pikem: Austraalia ja Okeaania.'],
  ['Austraalia ja Okeaania', 'wp', 'Austraalia ja Okeaania on maailmajagu: Austraalia manner koos Vaikse ookeani saartega.'],
  ['Antarktis', 'ct', 'Antarktis on manner. Maailmajao nimi on Antarktika.'],
  ['Antarktika', 'wp', 'Antarktika on maailmajagu: Antarktise manner koos ümbritsevate saartega.']
];
const TERM_LABEL = { ct: 'Manner', wp: 'Maailmajagu', both: 'Mõlemad' };

// "Kes keda uhub?" küsimused
function neighborQuestions() {
  const qs = [];
  for (const c of ofType('ct')) qs.push({ subject: c.key, layer: 'oc', pickType: 'oc', answer: c.oceans.map(o => 'oc:' + o),
    text: `Märgi kõik ookeanid, mille veed uhuvad mandrit <em>${c.name}</em>.` });
  for (const o of ofType('oc')) qs.push({ subject: o.key, layer: 'ct', pickType: 'ct', answer: o.cts.map(c => 'ct:' + c),
    text: `Märgi kõik mandrid, mida ääristab <em>${o.name}</em>.` });
  for (const o of ofType('oc')) qs.push({ subject: o.key, layer: 'oc', pickType: 'oc', answer: o.ocs.map(x => 'oc:' + x),
    text: `Märgi kõik ookeanid, millega <em>${o.name}</em> vahetult kokku puutub.` });
  return qs;
}

const ISLAND_INFO = { 'Gröönimaa': 'maailma suurim saar', 'Uus-Guinea': 'maailma suuruselt teine saar', 'Kalimantan': 'maailma suuruselt kolmas saar', 'Madagaskar': 'maailma suuruselt neljas saar', 'Saaremaa': 'Eesti suurim saar', 'Hiiumaa': 'Eesti suuruselt teine saar' };
const WP_NAME = Object.fromEntries(ofType('wp').map(w => [w.id, w.name]));
