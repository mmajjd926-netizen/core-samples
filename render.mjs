// Mockup renderer for "Core Samples" progress board. node render.mjs -> png files
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const SAND = {
  work:   ['#B5563A', '#A94F36', '#BE5E40'],   // terracotta
  health: ['#7E8F6A', '#768763', '#86976F'],   // sage
  home:   ['#D3A852', '#C99E4A', '#DAB05C'],   // ochre
  learn:  ['#4F6478', '#4A5E71', '#56697E'],   // slate blue
  people: ['#E8DFCF', '#E2D8C6', '#EDE5D7'],   // bone
  big:    ['#2E2B2A', '#353130', '#282524'],   // charcoal (milestone)
};
const KEYS = ['work', 'health', 'home', 'learn', 'people'];
const pick = (a) => a[Math.floor(rnd() * a.length)];

const W = 1600, H = 1000;
const TUBE_W = 46, TUBE_H = 560, GAP = 30;

function wall(label) {
  let s = `<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEE9E1"/><stop offset="1" stop-color="#E2DBD0"/></linearGradient>
  <linearGradient id="oak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C79A68"/><stop offset=".5" stop-color="#B98A57"/><stop offset="1" stop-color="#9C7044"/></linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".18" stop-color="#fff" stop-opacity=".08"/><stop offset=".7" stop-color="#fff" stop-opacity=".02"/><stop offset=".9" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
  <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
  <radialGradient id="light" cx=".3" cy=".1" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wall)"/><rect width="${W}" height="${H}" fill="url(#light)"/>`;
  if (label) { const ws = label.split(' '); let lines = [''], i = 0; for (const w of ws) { if ((lines[i] + ' ' + w).length > 88) lines[++i] = w; else lines[i] = (lines[i] ? lines[i] + ' ' : '') + w; } lines.forEach((l, j) => { s += `<text x="70" y="${H - 80 + j * 36 - (lines.length - 1) * 18}" font-family="DejaVu Serif" font-size="27" fill="#5f574e">${l}</text>`; }); }
  return s;
}

// one tube: layers = [{key, ml}] bottom-up; capacity ~150 ml
function tube(x, y, layers, { cork = false, tag = '' } = {}) {
  const ix = x + 4, iw = TUBE_W - 8, bottom = y + TUBE_H - 10, inner = TUBE_H - 40;
  const pxPerMl = inner / 150;
  let s = `<g>`;
  // shadow on wall
  s += `<rect x="${x + 14}" y="${y + 18}" width="${TUBE_W}" height="${TUBE_H}" rx="23" fill="#5a4a3a" opacity=".16" filter="url(#soft)"/>`;
  s += `<clipPath id="c${x}"><rect x="${ix}" y="${y + 6}" width="${iw}" height="${TUBE_H - 10}" rx="19"/></clipPath><g clip-path="url(#c${x})">`;
  let level = bottom;
  const parts = [];
  layers.forEach((L) => {
    const h = L.ml * pxPerMl;
    const top = level - h;
    const amp = 2 + rnd() * 5, ph = rnd() * 6.28, tilt = (rnd() - .5) * 6;
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const px = ix + (iw * k) / 12;
      const cone = -Math.sin((Math.PI * k) / 12) * amp;
      pts.push(`${px.toFixed(1)},${(top + cone + Math.sin(ph + k * .7) * 1.2 + tilt * (k / 12 - .5)).toFixed(1)}`);
    }
    const col = pick(SAND[L.key]);
    let g = `<path d="M${ix - 2},${bottom + 20} L${pts.join(' L')} L${ix + iw + 2},${bottom + 20} Z" fill="${col}"/>`;
    for (let q = 0; q < Math.max(3, h * 1.2); q++) {
      const gx = ix + rnd() * iw, gy = top + 2 + rnd() * (h - 1);
      g += `<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${(.5 + rnd() * .9).toFixed(2)}" fill="${rnd() < .5 ? '#fff' : '#000'}" opacity="${(.06 + rnd() * .12).toFixed(2)}"/>`;
    }
    parts.push(g);
    level = top;
  });
  s += parts.reverse().join('');
  s += `<rect x="${ix}" y="${y}" width="${iw}" height="${TUBE_H}" fill="url(#shade)"/></g>`;
  // glass body
  s += `<rect x="${x}" y="${y}" width="${TUBE_W}" height="${TUBE_H}" rx="23" fill="url(#glass)" stroke="#ffffff" stroke-opacity=".7" stroke-width="2"/>`;
  s += `<rect x="${x + 9}" y="${y + 30}" width="5" height="${TUBE_H - 80}" rx="2.5" fill="#fff" opacity=".55"/>`;
  // lip
  s += `<rect x="${x - 3}" y="${y - 4}" width="${TUBE_W + 6}" height="10" rx="5" fill="#fff" opacity=".6" stroke="#cfc8bd"/>`;
  if (cork) s += `<rect x="${x + 4}" y="${y - 26}" width="${TUBE_W - 8}" height="34" rx="5" fill="#C49A6C"/><rect x="${x + 4}" y="${y - 26}" width="${TUBE_W - 8}" height="34" rx="5" fill="#000" opacity=".25" filter="url(#grain)"/>`;
  if (tag) s += `<g transform="translate(${x + TUBE_W / 2},${y + TUBE_H + 52}) rotate(-4)"><line x1="0" y1="-44" x2="0" y2="-12" stroke="#8a7f72" stroke-width="1.5"/><rect x="-26" y="-12" width="52" height="30" rx="3" fill="#F7F2E8" stroke="#cbbfae"/><text x="0" y="9" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="13" fill="#5b5249">${tag}</text></g>`;
  return s + `</g>`;
}

function batten(x, y, n) {
  const w = n * (TUBE_W + GAP) + GAP;
  let s = `<rect x="${x + 8}" y="${y + 14}" width="${w}" height="70" rx="6" fill="#4a3a2a" opacity=".2" filter="url(#soft)"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="70" rx="6" fill="url(#oak)"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${x} ${y + 8 + i * 7} Q ${x + w / 3} ${y + 5 + i * 7 + (rnd() - .5) * 6} ${x + w} ${y + 8 + i * 7}" stroke="#7a5532" stroke-opacity=".18" fill="none"/>`;
  for (let i = 0; i < n; i++) {
    const cx = x + GAP + i * (TUBE_W + GAP) + TUBE_W / 2;
    s += `<circle cx="${cx}" cy="${y + 52}" r="3" fill="#6d5a45"/>`; // screw for drop clip
  }
  return { svg: s, w };
}

function clips(x, y, n, filled) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const tx = x + GAP + i * (TUBE_W + GAP);
    s += `<rect x="${tx - 5}" y="${y + 18}" width="${TUBE_W + 10}" height="16" rx="4" fill="#B89150" stroke="#8d6c35"/>`;
    s += `<rect x="${tx - 5}" y="${y + 18}" width="${TUBE_W + 10}" height="5" rx="2" fill="#fff" opacity=".35"/>`;
  }
  return s;
}

function week(tasks) { // returns layers
  const L = [];
  for (let i = 0; i < tasks; i++) {
    const r = rnd();
    const key = r < .07 ? 'big' : KEYS[Math.floor(rnd() * KEYS.length)];
    L.push({ key, ml: key === 'big' ? 10 : 5 });
  }
  return L;
}

function scene({ name, n = 12, fills, corks, tags, label, extra = '' }) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` + wall(label);
  const bw = n * (TUBE_W + GAP) + GAP;
  const bx = (W - bw) / 2, by = 120;
  const b = batten(bx, by, n);
  s += b.svg;
  for (let i = 0; i < n; i++) {
    const tx = bx + GAP + i * (TUBE_W + GAP);
    s += tube(tx, by - 28, fills[i] || [], { cork: corks[i], tag: tags[i] || '' });
  }
  s += clips(bx, by + 8, n);
  s += extra;
  s += '</svg>';
  fs.writeFileSync(`${name}.svg`, s);
  if (name.startsWith('_')) { console.log('part', name); return s; }
  const png = new Resvg(s, { font: { loadSystemFonts: true }, fitTo: { mode: 'width', value: 1600 } }).render().asPng();
  fs.writeFileSync(`${name}.png`, png);
  console.log('wrote', name);
}

// shelf with jars, funnel, scoop (used in empty scene)
function kit() {
  let s = `<g transform="translate(0,-95)">`;
  s += `<rect x="1080" y="840" width="460" height="18" rx="3" fill="url(#oak)"/>`;
  const cols = ['work', 'health', 'home', 'learn', 'people', 'big'];
  cols.forEach((k, i) => {
    const x = 1095 + i * 72;
    s += `<rect x="${x}" y="772" width="56" height="68" rx="8" fill="${SAND[k][0]}"/><rect x="${x}" y="760" width="56" height="80" rx="8" fill="url(#glass)" stroke="#fff" stroke-opacity=".7"/><rect x="${x + 4}" y="748" width="48" height="14" rx="3" fill="#C49A6C"/>`;
    s += `<text x="${x + 28}" y="880" text-anchor="middle" font-family="DejaVu Sans Mono" font-size="12" fill="#6b6259">${k}</text>`;
  });
  return s + '</g>';
}

const n = 12;
const empty = Array(n).fill([]);
scene({ name: '1-empty', fills: empty, corks: Array(n).fill(false), tags: [], label: 'Day 0: twelve empty week-tubes on an oak batten. Six jars of coloured sand, a funnel and one 5 ml scoop.', extra: kit() });

seed = 11;
const w1 = [week(19), week(3)];
scene({ name: '2-one-week', fills: [...w1, ...Array(n - 2).fill([])], corks: [true], tags: ['W01', 'W02'], label: 'After one week: 19 tasks = 19 layers. Sunday night the tube gets a cork and a tag.' });

seed = 23;
const q = Array.from({ length: n }, (_, i) => week([14, 18, 21, 9, 17, 20, 16, 4, 12, 19, 18, 15][i]));
scene({ name: '3-three-months', fills: q, corks: Array(n).fill(true), tags: q.map((_, i) => `W${String(i + 1).padStart(2, '0')}`), label: 'After a quarter: a core sample of twelve weeks. The thin tube (W08) was the week you were sick; it stays.' });

// one year: four quarters, small, on one wall
const parts = [];
const seeds = [101, 202, 303, 404];
for (let k = 0; k < 4; k++) {
  seed = seeds[k];
  const fills = Array.from({ length: n }, () => week(8 + Math.floor(rnd() * 15)));
  parts.push(scene({ name: `_q${k + 1}`, fills, corks: Array(n).fill(true), tags: fills.map((_, i) => `W${String(k * 12 + i + 1).padStart(2, '0')}`) }));
}
let y = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` + wall('After a year: four battens, one per season, hung as a block. The board never runs out of room; you just add another row of wall.');
const pos = [[60, 10], [800, 10], [60, 420], [800, 420]];
parts.forEach((svg, k) => {
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/<rect width="1600" height="1000" fill="url\(#wall\)"\/><rect width="1600" height="1000" fill="url\(#light\)"\/>/, '');
  y += `<svg x="${pos[k][0]}" y="${pos[k][1]}" width="740" height="462" viewBox="300 20 1000 760">${inner}</svg>`;
});
y += '</svg>';
fs.writeFileSync('4-one-year.svg', y);
fs.writeFileSync('4-one-year.png', new Resvg(y, { font: { loadSystemFonts: true } }).render().asPng());
console.log('wrote 4-one-year');
