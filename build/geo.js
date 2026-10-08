// Helpers: densify, point-in-polygon, Douglas-Peucker, path formatting
export function densify(pts, step = 0.25) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 0; k < n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
export function closeRing(pts) {
  const a = pts[0], b = pts[pts.length - 1];
  return (a[0] === b[0] && a[1] === b[1]) ? pts : [...pts, a];
}
export function pip(pt, ring) {
  const [x, y] = pt; let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function dpRec(pts, s, e, tol2, keep) {
  let maxd = -1, idx = -1;
  const [ax, ay] = pts[s], [bx, by] = pts[e];
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  for (let i = s + 1; i < e; i++) {
    const [px, py] = pts[i];
    let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx - px, qy = ay + t * dy - py, d = qx * qx + qy * qy;
    if (d > maxd) { maxd = d; idx = i; }
  }
  if (maxd > tol2) { keep[idx] = 1; dpRec(pts, s, idx, tol2, keep); dpRec(pts, idx, e, tol2, keep); }
}
export function simplify(pts, tol) {
  if (pts.length < 5) return pts;
  // split closed ring at farthest point from first to keep shape stable
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
  const keep = new Uint8Array(pts.length); keep[0] = 1; keep[far] = 1; keep[pts.length - 1] = 1;
  dpRec(pts, 0, far, tol * tol, keep); dpRec(pts, far, pts.length - 1, tol * tol, keep);
  return pts.filter((_, i) => keep[i]);
}
export function ringArea(pts) { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return a / 2; }
const f1 = v => (Math.round(v * 10) / 10).toString();
export function ringsToPath(rings) {
  let s = '';
  for (const r of rings) {
    if (r.length < 3) continue;
    let px = Math.round(r[0][0] * 10), py = Math.round(r[0][1] * 10);
    s += 'M' + f1(r[0][0]) + ',' + f1(r[0][1]);
    for (let i = 1; i < r.length; i++) {
      const x = Math.round(r[i][0] * 10), y = Math.round(r[i][1] * 10);
      if (x === px && y === py) continue;
      s += 'l' + ((x - px) / 10) + ',' + ((y - py) / 10);
      px = x; py = y;
    }
    s += 'z';
  }
  return s.replace(/l0,/g, 'v').replace(/,0(?=[lzv])/g, (m) => m); // light cleanup
}
// d3 geoPath context that collects projected rings
export function ringCollector() {
  const rings = []; let cur = null;
  return {
    rings,
    moveTo(x, y) { cur = [[x, y]]; rings.push(cur); },
    lineTo(x, y) { cur.push([x, y]); },
    closePath() { if (cur && cur.length) cur.push([cur[0][0], cur[0][1]]); },
    arc() {}, rect() {}
  };
}
