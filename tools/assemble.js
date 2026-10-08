// Paneb kokku index.html: src/ + map-data.js → üks iseseisev fail (käivita: npm run build)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const head = read('src/01-style.html').trim();
const body = read('src/02-body.html').trim();
const app = ['10-data.js', '20-core.js', '30-explore.js', '40-quiz.js', '50-modes.js'].map(f => read('src/' + f)).join('\n');
const map = read('map-data.js');

const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 44'%3E%3Ccircle cx='22' cy='22' r='20' fill='%23b7dbef' stroke='%2313213b' stroke-width='2.5'/%3E%3Cpath d='M9 15c4 1 6-2 9 0s1 6 5 6 5-5 9-3M12 30c3-2 6 0 8 2s6 1 7-1' fill='none' stroke='%23ef9442' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E";
const desc = 'Interaktiivne harjutusatlas: täpne maailmakaart, mängud, õpiku küsimused ja kontrolltöö mandrite, ookeanide ja maailmajagude selgeks saamiseks.';
const reset = ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}';

const html = `<!doctype html>
<html lang="et">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="Mandrid, ookeanid ja maailmajaod">
<meta property="og:description" content="${desc}">
<link rel="icon" href="${icon}">
<style>${reset}</style>
${head}
</head>
<body>
${body}
<script>
${map}</script>
<script>
${app}</script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('index.html valmis:', (html.length / 1024).toFixed(0), 'KB');
