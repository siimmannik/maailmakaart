import { contours } from 'd3-contour';
import { pip, simplify, ringsToPath, ringArea } from './geo.js';

// Indian Ocean region (lon/lat); land-crossing parts are hidden under land
const INDIAN = [
  [20.0, -60], [146.92, -60], [146.92, -43.64], [146.5, -41.0], [146.5, -38.9], [145.0, -37.0], [135.0, -25.0], [132.0, -13.0],
  [131.8, -11.3], [127.3, -8.45], [126.5, -8.75], [125.5, -8.95], [124.5, -9.5], [123.7, -10.15], [121.8, -10.65], [120.5, -10.35],
  [119.0, -9.85], [117.0, -9.15], [116.0, -8.95], [115.1, -8.9], [114.5, -8.75], [111.0, -8.3], [108.0, -7.85], [106.5, -7.45],
  [105.3, -6.9], [105.85, -6.0], [104.5, -4.0], [103.3, -1.5], [102.6, 0.3], [103.15, 0.85], [103.38, 1.12], [103.55, 1.32],
  [103.4, 2.4], [102.6, 3.6], [102.0, 4.5], [101.4, 5.8], [100.1, 7.0], [99.4, 8.5], [98.95, 10.3], [99.3, 12.0], [99.15, 13.5],
  [98.8, 16.0], [100.0, 22.0], [99.0, 28.0], [90.0, 33.0], [80.0, 36.0], [70.0, 36.0], [60.0, 34.5], [50.0, 33.5], [45.0, 32.5],
  [42.0, 30.0], [36.0, 30.0], [34.6, 30.0], [32.5, 30.0], [31.0, 29.5], [28.0, 25.0], [25.0, 20.0], [25.0, 10.0], [25.0, 0.0],
  [25.0, -10.0], [25.0, -20.0], [24.0, -30.0], [20.0, -34.83]
];
// Atlantic region: west = divide over the Americas, east = Africa/Europe
const ATLANTIC = [
  [-67.27, -60], [-67.27, -56.0], [-68.3, -54.6], [-68.8, -53.5], [-70.0, -52.0], [-71.0, -46.0], [-70.0, -40.0], [-67.0, -30.0],
  [-65.0, -20.0], [-66.0, -10.0], [-70.0, 0.0], [-73.5, 5.0], [-77.6, 7.8], [-77.9, 8.65], [-78.6, 9.1], [-79.6, 9.15],
  [-80.6, 8.65], [-81.5, 8.45], [-82.4, 8.55], [-83.2, 9.1], [-84.0, 10.0], [-84.7, 11.3], [-85.5, 13.0], [-87.0, 14.5],
  [-90.0, 15.5], [-92.5, 16.3], [-94.6, 17.2], [-98.0, 20.0], [-104.0, 27.0], [-106.5, 32.0], [-108.0, 40.0], [-112.0, 50.0],
  [-118.0, 60.0], [-125.0, 66.6], [45.0, 66.6], [45.0, 47.6], [42.0, 41.0], [42.0, 30.0], [36.0, 30.0], [34.6, 30.0],
  [32.5, 30.0], [31.0, 29.5], [28.0, 25.0], [25.0, 20.0], [25.0, 10.0], [25.0, 0.0], [25.0, -10.0], [25.0, -20.0],
  [24.0, -30.0], [20.0, -34.83], [20.0, -60]
];
export const ARCTIC_LAT = 66.56;
export function classify(lon, lat) {
  if (lat >= ARCTIC_LAT) return 'pohja-jaameri';
  if (lat <= -60) return 'louna-jaameri';
  if (lon >= -96 && lon <= -76 && lat >= 51) return 'pohja-jaameri';      // Hudson Bay, James Bay
  if (lon > -76 && lon <= -64.5 && lat >= 55) return 'pohja-jaameri';     // Ungava, Hudson Strait
  if (lon >= 31 && lon <= 45.5 && lat >= 63.3) return 'pohja-jaameri';    // White Sea
  if (lon >= 42 && lon <= 170 && lat >= 64) return 'pohja-jaameri';       // Siberian bays (Ob)
  if (lon >= -6 && lon <= 42 && lat >= 30 && lat <= 47.6) return 'atlandi'; // Mediterranean, Black Sea
  if (pip([lon, lat], INDIAN)) return 'india';
  if (pip([lon, lat], ATLANTIC)) return 'atlandi';
  return 'vaikne';
}
export function buildOceans(P, CENTER, res = 0.2, tol = 0.25) {
  const n = Math.round(360 / res), m = Math.round(180 / res);
  const ids = ['vaikne', 'atlandi', 'india', 'louna-jaameri', 'pohja-jaameri'];
  const cls = new Uint8Array(n * m);
  for (let y = 0; y < m; y++) {
    const lat = 90 - (y + 0.5) * res;
    for (let x = 0; x < n; x++) {
      let lon = -180 + (x + 0.5) * res + CENTER; if (lon >= 180) lon -= 360;
      cls[y * n + x] = ids.indexOf(classify(lon, lat));
    }
  }
  const res_ = [];
  for (let k = 0; k < ids.length; k++) {
    const vals = new Float64Array(n * m); for (let i = 0; i < vals.length; i++) vals[i] = cls[i] === k ? 1 : 0;
    const [mp] = contours().size([n, m]).thresholds([0.5])(vals);
    const rings = [];
    for (const poly of mp.coordinates) for (const ring of poly) {
      const pr = ring.map(([X, Y]) => P(Math.max(-180, Math.min(180, -180 + X * res)), Math.max(-90, Math.min(90, 90 - Y * res))));
      const s = simplify(pr, tol); if (s.length >= 4 && Math.abs(ringArea(s)) > 0.5) rings.push(s);
    }
    res_.push({ id: ids[k], d: ringsToPath(rings) });
  }
  return res_;
}
