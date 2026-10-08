import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as topo from 'topojson-client';
import * as d3 from 'd3-geo';
import pc from 'polygon-clipping';
import { contours } from 'd3-contour';
import { densify, closeRing, pip, simplify, ringsToPath, ringCollector, ringArea } from './geo.js';

// Kaardi ehitus: Natural Earth 50m → map-data.js (käivita: npm run map)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modPath = f => path.join(ROOT, 'node_modules', f);
const W = 1000, CENTER = 11, PAD = 3;
const sphere = { type: 'Sphere' };
const proj = d3.geoNaturalEarth1().rotate([-CENTER, 0]).precision(0.05);
proj.fitWidth(W - 2 * PAD, sphere);
const b0 = d3.geoPath(proj).bounds(sphere);
const H = Math.ceil(b0[1][1] - b0[0][1] + 2 * PAD);
proj.fitExtent([[PAD, PAD], [W - PAD, H - PAD]], sphere);
const K = proj.scale(), [TX, TY] = proj.translate();
const raw = d3.geoNaturalEarth1Raw;
const rad = Math.PI / 180;
// project map-longitude (lon-CENTER, -180..180) without wrap
const P = (lp, la) => { const [x, y] = raw(lp * rad, la * rad); return [TX + K * x, TY - K * y]; };

// ---------- countries ----------
const t = JSON.parse(fs.readFileSync(modPath('world-atlas/countries-50m.json')));
const fc = topo.feature(t, t.objects.countries);
const wc = JSON.parse(fs.readFileSync(modPath('world-countries/countries.json')));
const byNum = {}; for (const c of wc) if (c.ccn3) byNum[c.ccn3] = c;
const MISSING = { 'Somaliland': 'AF', 'Kosovo': 'EU', 'N. Cyprus': 'AS', 'Indian Ocean Ter.': 'AS', 'Siachen Glacier': 'AS' };
function defaultGroup(f) {
  if (MISSING[f.properties.name]) return MISSING[f.properties.name];
  if (f.id === '196') return 'AS'; // Cyprus: geographically Asia
  const c = byNum[f.id]; if (!c) throw new Error('no region ' + f.properties.name);
  switch (c.region) {
    case 'Europe': return 'EU'; case 'Asia': return 'AS'; case 'Africa': return 'AF';
    case 'Oceania': return 'OC'; case 'Antarctic': return 'AN';
    case 'Americas': return c.subregion === 'South America' ? 'SA' : 'NA';
  }
  throw new Error('region? ' + c.region);
}
function centroidOf(poly) { // planar centroid of outer ring (lon/lat)
  const r = poly[0]; let x = 0, y = 0; for (const p of r) { x += p[0]; y += p[1]; } return [x / r.length, y / r.length];
}
function overrideGroup(f, g, poly) {
  const [lon, lat] = centroidOf(poly);
  switch (f.id) {
    case '250': // France
      if (lon < -50 && lon > -56 && lat > 1 && lat < 7) return 'SA';
      if (lon < -55) return 'NA';
      if (lon > 40 && lat < -5) return 'AF';
      return 'EU';
    case '528': return lon < -50 ? 'NA' : 'EU';
    case '578': return lat < -40 ? 'AN' : 'EU';
    case '724': if (lon < -12 && lat < 30) return 'AF'; if (lat < 36 && lon > -6 && lon < -2) return 'AF'; return 'EU';
    case '620': return (lon < -15 && lat < 34) ? 'AF' : 'EU';
    case '840': return (lon < -150 && lon > -162 && lat < 24 && lat > 17) ? 'OC' : 'NA';
    case '152': return lon < -100 ? 'OC' : 'SA';
    case '360': return lon >= 130.5 ? 'OC' : 'AS';
  }
  return g;
}
// Europe clip polygon (Urals, Ural River, Caspian, Kuma–Manych, Azov, Kerch, Black Sea, Bosporus, Dardanelles)
const EURO = closeRing(densify([
  [-30, 86], [75, 86], [75, 78], [70, 76], [67, 74], [66, 72], [65.8, 70], [66.2, 68.5],
  [64.6, 66.1], [62.0, 65.4], [60.1, 65.0], [59.0, 63.9], [59.3, 62.0], [59.4, 60.0], [59.8, 58.5], [60.0, 57.4], [60.25, 56.9],
  [59.5, 55.0], [59.1, 53.8], [59.0, 52.5], [58.6, 51.2], [57.2, 51.4], [55.1, 51.75], [53.2, 51.45], [51.4, 51.2], [51.2, 50.4],
  [51.5, 49.0], [51.8, 47.6], [51.9, 47.1], [52.0, 46.6], [49.5, 45.8], [47.4, 44.9], [46.0, 44.85], [44.5, 45.1], [43.5, 45.9],
  [42.6, 46.4], [41.3, 46.8], [40.4, 47.2], [39.4, 47.1], [38.4, 47.0], [37.0, 46.0], [36.65, 45.35], [36.5, 44.3], [33.0, 43.0],
  [29.2, 41.3], [29.05, 41.05], [29.0, 40.95], [28.5, 40.8], [27.2, 40.6], [26.68, 40.36], [26.4, 40.1], [26.15, 40.0],
  [25.8, 39.8], [25.0, 35.0], [-30, 30], [-30, 86]
], 0.25));
const SINAI = closeRing(densify([
  [32.31, 31.7], [32.31, 31.25], [32.29, 30.6], [32.38, 30.3], [32.56, 29.93], [32.56, 29.5], [32.85, 29.0], [33.12, 28.5],
  [33.45, 28.0], [33.9, 27.5], [35.5, 27.5], [35.5, 31.7], [32.31, 31.7]
], 0.1));

function unwrap(poly) {
  const r0 = poly[0]; let jump = false;
  for (let i = 1; i < r0.length; i++) if (Math.abs(r0[i][0] - r0[i - 1][0]) > 180) { jump = true; break; }
  if (!jump) return [poly];
  const sh = poly.map(r => r.map(([x, y]) => [x < 0 ? x + 360 : x, y]));
  const box = (a, b) => [[[a, -90], [b, -90], [b, 90], [a, 90], [a, -90]]];
  const west = pc.intersection([sh], box(0, 180));
  const east = pc.intersection([sh], box(180, 360)).map(p => p.map(r => r.map(([x, y]) => [x - 360, y])));
  return [...west, ...east];
}
const groups = { EU: [], AS: [], AF: [], NA: [], SA: [], OC: [], AN: [] };
for (const f of fc.features) {
  const g0 = defaultGroup(f);
  const polys0 = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const polys = f.id === '010' ? polys0 : polys0.flatMap(unwrap);
  if (['643', '398', '792'].includes(f.id)) {
    const near = polys.filter(p => { const xs = p[0].map(c => c[0]); return Math.min(...xs) < 75 && Math.max(...xs) > 15; });
    const far = polys.filter(p => !near.includes(p));
    far.forEach(p => groups.AS.push(p));
    if (near.length) {
      pc.intersection(near, [EURO]).forEach(p => groups.EU.push(p));
      pc.difference(near, [EURO]).forEach(p => groups.AS.push(p));
    }
    continue;
  }
  if (f.id === '818') {
    pc.intersection(polys, [SINAI]).forEach(p => groups.AS.push(p));
    pc.difference(polys, [SINAI]).forEach(p => groups.AF.push(p));
    continue;
  }
  for (const p of polys) groups[overrideGroup(f, g0, p)].push(p);
}

const ISLAND_NAMES = [
  ['Suurbritannia', -2, 53], ['Iirimaa', -8, 53.3], ['Island', -19, 65], ['Spitsbergen', 14, 78.9],
  ['Novaja Zemlja', 55, 74], ['Novaja Zemlja', 56, 71.5], ['Sitsiilia', 14.2, 37.5], ['Sardiinia', 9.0, 40.0], ['Korsika', 9.1, 42.2],
  ['Kreeta', 24.9, 35.2], ['Saaremaa', 22.5, 58.4], ['Hiiumaa', 22.6, 58.9], ['Gotland', 18.5, 57.5],
  ['Kalimantan', 114, 1], ['Sumatra', 101.5, 0], ['Honshū', 138.5, 36.5], ['Sulawesi', 121, -2], ['Jaava', 110, -7.4],
  ['Luzon', 121, 16.5], ['Mindanao', 125, 7.5], ['Hokkaidō', 143, 43.3], ['Sahhalin', 142.8, 50], ['Sri Lanka', 80.7, 7.8],
  ['Taiwan', 121, 23.7], ['Kyūshū', 131, 32.8], ['Hainan', 109.7, 19.2], ['Küpros', 33, 35], ['Timor', 125, -9.2],
  ['Madagaskar', 46.5, -19.5],
  ['Gröönimaa', -40, 72], ['Baffini saar', -70, 68], ['Victoria saar', -110, 71], ['Ellesmere’i saar', -80, 80],
  ['Newfoundland', -56, 48.7], ['Kuuba', -79, 21.6], ['Hispaniola', -71, 19], ['Banksi saar', -121, 73], ['Devoni saar', -87, 75],
  ['Vancouveri saar', -125.5, 49.6], ['Jamaica', -77.3, 18.1],
  ['Tulemaa', -68.5, -54], ['Falklandi saared', -59, -51.7],
  ['Uus-Guinea', 142, -5], ['Lõunasaar', 170, -44], ['Põhjasaar', 175.5, -38.5], ['Tasmaania', 146.6, -42],
  ['Hawaii', -155.5, 19.6], ['Uus-Kaledoonia', 165.5, -21.3], ['Uus-Britannia', 151.5, -5.5]
];

// d3 winding fix + projection
function toD3Poly(p) {
  let g = { type: 'Polygon', coordinates: p.map(r => r.slice()) };
  if (d3.geoArea(g) > 2 * Math.PI) g.coordinates = g.coordinates.map(r => r.slice().reverse());
  return g;
}
function projectPoly(g, tol) {
  const c = ringCollector();
  d3.geoPath(proj, c)(g);
  return c.rings.map(r => simplify(r, tol)).filter(r => r.length >= 4 && Math.abs(ringArea(r)) > 0.02);
}
const R2 = 6371 * 6371;
const out = { w: W, h: H, land: [], oceans: [], lakes: [], lines: {}, pts: {} };
const GROUP_INFO = { EU: ['euroopa', 'euraasia'], AS: ['aasia', 'euraasia'], AF: ['aafrika', 'aafrika'], NA: ['ameerika', 'pohja-ameerika'], SA: ['ameerika', 'louna-ameerika'], OC: ['austraalia-okeaania', 'austraalia'], AN: ['antarktika', 'antarktis'] };
const areaReport = {};
for (const [gk, polys] of Object.entries(groups)) {
  const t0 = Date.now();
  const u = gk === 'AN' ? polys : pc.union(...polys.map(p => [p]));
  const items = u.map(p => { const g = toD3Poly(p); return { p, g, km2: d3.geoArea(g) * R2 }; }).sort((a, b) => b.km2 - a.km2);
  const [wp, ct] = GROUP_INFO[gk];
  const main = items[0];
  areaReport[gk] = { pieces: items.length, mainland: Math.round(main.km2 / 1e4) / 100, total: Math.round(items.reduce((s, i) => s + i.km2, 0) / 1e4) / 100, ms: Date.now() - t0 };
  out.land.push({ id: gk.toLowerCase() + '-main', wp, ct, d: ringsToPath(projectPoly(main.g, 0.22)) });
  const named = {}; const others = []; const dots = [];
  for (const it of items.slice(1)) {
    const nm = ISLAND_NAMES.find(([n, lo, la]) => pip([lo, la], it.p[0]));
    const rings = projectPoly(it.g, 0.22);
    const pxArea = rings.reduce((s, r) => s + Math.abs(ringArea(r)), 0);
    if (nm) { (named[nm[0]] ||= []).push(...rings); continue; }
    if (gk === 'OC' && pxArea < 1.2) {
      const [x, y] = proj(d3.geoCentroid(it.g)); if (x != null) dots.push([x, y]); continue;
    }
    others.push(...rings);
  }
  for (const [n, rings] of Object.entries(named)) out.land.push({ id: gk.toLowerCase() + '-' + n, wp, ct: null, isl: n, d: ringsToPath(rings) });
  let dd = ringsToPath(others);
  for (const [x, y] of dots) { const r = 0.9; dd += `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0z`; }
  out.land.push({ id: gk.toLowerCase() + '-isl', wp, ct: null, isl: '', d: dd });
}
console.log(areaReport);

import { buildOceans } from './oceans.js';
out.oceans = buildOceans(P, CENTER);
// Caspian Sea (lake) from land-50m hole
{
  const l = JSON.parse(fs.readFileSync(modPath('world-atlas/land-50m.json')));
  const land = topo.feature(l, l.objects.land);
  const mp = land.features[0].geometry.coordinates;
  for (const p of mp) for (let h = 1; h < p.length; h++) {
    const xs = p[h].map(c => c[0]);
    if (Math.min(...xs) > 40 && Math.max(...xs) < 60) {
      const g = toD3Poly([p[h]]);
      out.lakes.push({ id: 'kaspia', d: ringsToPath(projectPoly(g, 0.2)) });
    }
  }
}
const sp = ringCollector(); d3.geoPath(proj, sp)(sphere);
out.sphere = ringsToPath(sp.rings.map(r => simplify(r, 0.1)));
const line = (lat) => { const pts = []; for (let lp = -180; lp <= 180; lp += 2) pts.push(P(lp, lat)); return 'M' + pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L'); };
out.lines = { ekvaator: line(0), pohjapoorijoon: line(23.44), lounapoorijoon: line(-23.44), pohjapolaarjoon: line(66.56), lounapolaarjoon: line(-66.56) };
const meridian = (lon) => { const pts = []; for (let la = -90; la <= 90; la += 2) pts.push(proj([lon, la])); return 'M' + pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join('L'); };
out.lines.m0 = meridian(0);
// label / anchor points
const LP = {
  'c:euraasia': [78, 60], 'c:aafrika': [21, -2], 'c:pohja-ameerika': [-102, 47], 'c:louna-ameerika': [-59, -13], 'c:austraalia': [134, -26], 'c:antarktis': [30, -80],
  'w:euroopa': [22, 53], 'w:aasia': [96, 44], 'w:aafrika': [19, 13], 'w:ameerika': [-87, 15], 'w:austraalia-okeaania': [158, -14], 'w:antarktika': [100, -74],
  'o:vaikne': [-140, 14], 'o:vaikne2': [168, 22], 'o:atlandi': [-36, 22], 'o:india': [78, -20], 'o:louna-jaameri': [-28, -64], 'o:pohja-jaameri': [-4, 80.5],
  'eesti': [25.5, 58.7], 'kaspia': [51, 42], 'tallinn': [24.75, 59.44],
  'l:ekvaator': [-162, 0], 'l:pohjapoorijoon': [-162, 23.44], 'l:lounapoorijoon': [-162, -23.44], 'l:pohjapolaarjoon': [-150, 66.56], 'l:lounapolaarjoon': [-150, -66.56]
};
for (const [k, ll] of Object.entries(LP)) { const p = proj(ll); out.pts[k] = [+p[0].toFixed(1), +p[1].toFixed(1)]; }
out.lon2x = { k: K, tx: TX, ty: TY, center: CENTER };
const js = 'window.MAPDATA=' + JSON.stringify(out) + ';\n';
fs.writeFileSync(path.join(ROOT, 'map-data.js'), js);
console.log('W,H', W, H, 'size KB', (js.length / 1024).toFixed(0), 'land paths', out.land.length, out.land.map(l => l.id + ':' + (l.d.length / 1024).toFixed(0)).join(' '));
console.log('oceans', out.oceans.map(o => o.id + ':' + (o.d.length / 1024).toFixed(1)).join(' '), 'lakes', out.lakes.length);

