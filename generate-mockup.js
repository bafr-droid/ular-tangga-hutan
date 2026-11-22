/* Pembuat mockup SVG untuk desain baru "Petualangan Hutan".
   Jalankan: node generate-mockup.js -> mockup.svg */
const fs = require("fs");

const COLS = 10, ROWS = 10, LAST = COLS * ROWS;
const LADDERS = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81 };
const SNAKES = { 27: 7, 40: 18, 54: 31, 66: 45, 89: 53, 96: 74 };

const CELL = 32, GAP = 2, PAD = 8;
const BX = 758, BY = 210;
const W = COLS * CELL + (COLS - 1) * GAP + 2 * PAD;
const H = ROWS * CELL + (ROWS - 1) * GAP + 2 * PAD;

const center = (num) => {
  const fromBottom = Math.ceil(num / COLS) - 1;
  const row = ROWS - 1 - fromBottom;
  const idx = (num - 1) % COLS;
  const col = fromBottom % 2 === 0 ? idx : COLS - 1 - idx;
  return { x: BX + PAD + col * (CELL + GAP) + CELL / 2, y: BY + PAD + row * (CELL + GAP) + CELL / 2 };
};

let cells = "";
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const fromBottom = ROWS - 1 - row;
    const base = fromBottom * COLS;
    const num = fromBottom % 2 === 0 ? base + col + 1 : base + COLS - col;
    const x = BX + PAD + col * (CELL + GAP), y = BY + PAD + row * (CELL + GAP);
    let fill = (row + col) % 2 === 0 ? "#FDF3DB" : "#F2E1BF";
    if (LADDERS[num]) fill = "#FBE3B8";
    if (SNAKES[num]) fill = "#D7ECC0";
    if (num === LAST) fill = "#F2B45A";
    cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="6" fill="${fill}"/>`;
    cells += `<text x="${x + 3}" y="${y + 10}" font-size="8" font-weight="700" fill="#A07150">${num}</text>`;
    if (LADDERS[num] || SNAKES[num]) {
      const isL = Boolean(LADDERS[num]);
      cells += `<text x="${x + CELL / 2}" y="${y + CELL / 2 + 5}" text-anchor="middle" font-size="15">${String.fromCodePoint(isL ? 0x1FA9C : 0x1F40D)}</text>`;
      cells += `<text x="${x + CELL - 2}" y="${y + CELL - 3}" text-anchor="end" font-size="6" font-weight="700" fill="#804020">\u2192${isL ? LADDERS[num] : SNAKES[num]}</text>`;
    }
  }
}

const UNIT = CELL;
function makeCurve(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(len * .16, UNIT * .55);
  const c = { x: (a.x + b.x) / 2 - (dy / len) * bend, y: (a.y + b.y) / 2 + (dx / len) * bend };
  const at = (t) => ({
    x: (1-t)*(1-t)*a.x + 2*(1-t)*t*c.x + t*t*b.x,
    y: (1-t)*(1-t)*a.y + 2*(1-t)*t*c.y + t*t*b.y,
  });
  const dir = (t) => {
    const vx = 2*(1-t)*(c.x-a.x) + 2*t*(b.x-c.x);
    const vy = 2*(1-t)*(c.y-a.y) + 2*t*(b.y-c.y);
    const l = Math.hypot(vx, vy) || 1;
    return { tx: vx/l, ty: vy/l, nx: -vy/l, ny: vx/l };
  };
  const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  return { d, at, dir, a, b, len };
}
function offsetPath(curve, offset) {
  const steps = 16;
  let d = "";
  for (let i=0;i<=steps;i++) {
    const t=i/steps, p=curve.at(t), n=curve.dir(t);
    d += `${i===0?"M":"L"}${(p.x+n.nx*offset).toFixed(1)} ${(p.y+n.ny*offset).toFixed(1)} `;
  }
  return d.trim();
}
function ladderSvg(curve) {
  const gap = UNIT * .16, railW = 2, rungW = 1.6;
  const rungs = Math.max(3, Math.min(6, Math.round(curve.len / (UNIT * .26))));
  let s = "";
  s += `<path d="${offsetPath(curve, -gap/2)}" stroke="#C58153" stroke-width="${railW}" fill="none" stroke-linecap="round" opacity=".95"/>`;
  s += `<path d="${offsetPath(curve, gap/2)}" stroke="#C58153" stroke-width="${railW}" fill="none" stroke-linecap="round" opacity=".95"/>`;
  for (let i=1;i<=rungs;i++) {
    const t=.12+(i/(rungs+1))*.76, p=curve.at(t), n=curve.dir(t), h=gap/2;
    s += `<line x1="${(p.x+n.nx*h).toFixed(1)}" y1="${(p.y+n.ny*h).toFixed(1)}" x2="${(p.x-n.nx*h).toFixed(1)}" y2="${(p.y-n.ny*h).toFixed(1)}" stroke="#804020" stroke-width="${rungW}" stroke-linecap="round" opacity=".9"/>`;
  }
  return s;
}
function snakeSvg(curve) {
  const bodyW = 4, outlineW = 5.6;
  const scales = Math.max(3, Math.min(8, Math.round(curve.len / (UNIT * .22))));
  let s = "";
  s += `<path d="${curve.d}" stroke="#1D7302" stroke-width="${outlineW}" fill="none" stroke-linecap="round" opacity=".9"/>`;
  s += `<path d="${curve.d}" stroke="#48B088" stroke-width="${bodyW}" fill="none" stroke-linecap="round" opacity=".96"/>`;
  for (let i=0;i<scales;i++) {
    const t=.12+(i/(scales+1))*.74, p=curve.at(t), n=curve.dir(t), h=bodyW*.32;
    s += `<line x1="${(p.x+n.nx*h).toFixed(1)}" y1="${(p.y+n.ny*h).toFixed(1)}" x2="${(p.x-n.nx*h).toFixed(1)}" y2="${(p.y-n.ny*h).toFixed(1)}" stroke="#145200" stroke-width="1" opacity=".5"/>`;
  }
  const headDir = curve.dir(0);
  const angle = (Math.atan2(headDir.ty, headDir.tx) * 180 / Math.PI) + 180;
  const rx = UNIT * .20, ry = UNIT * .14;
  const eye = UNIT * .035, pupil = UNIT * .016, snout = UNIT * .19;
  s += `<g transform="translate(${curve.a.x.toFixed(1)} ${curve.a.y.toFixed(1)}) rotate(${angle.toFixed(1)})">`;
  s += `<ellipse cx="0" cy="0" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#48B088" stroke="#1D7302" stroke-width="1"/>`;
  for (const sign of [-1, 1]) {
    s += `<circle cx="${(UNIT*.08).toFixed(1)}" cy="${(sign*UNIT*.06).toFixed(1)}" r="${eye.toFixed(1)}" fill="#FDF3DB" stroke="#1D7302" stroke-width=".6"/>`;
    s += `<circle cx="${(UNIT*.095).toFixed(1)}" cy="${(sign*UNIT*.06).toFixed(1)}" r="${pupil.toFixed(1)}" fill="#145200"/>`;
  }
  s += `<path d="M ${snout.toFixed(1)} 0 q ${(UNIT*.10).toFixed(1)} ${(-UNIT*.03).toFixed(1)} ${(UNIT*.14).toFixed(1)} ${(-UNIT*.07).toFixed(1)} M ${snout.toFixed(1)} 0 q ${(UNIT*.10).toFixed(1)} ${(UNIT*.03).toFixed(1)} ${(UNIT*.14).toFixed(1)} ${(UNIT*.07).toFixed(1)}" stroke="#D96C5F" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}
let lines = "";
for (const [f, t] of Object.entries(LADDERS)) lines += ladderSvg(makeCurve(center(+f), center(t)));
for (const [f, t] of Object.entries(SNAKES)) lines += snakeSvg(makeCurve(center(+f), center(t)));

const pawn = (num, color, emoji, dx) => {
  const c = center(num);
  return `<circle cx="${c.x + dx}" cy="${c.y}" r="10" fill="${color}" stroke="#fff" stroke-width="2.5"/><text x="${c.x + dx}" y="${c.y + 4}" text-anchor="middle" font-size="13">${emoji}</text>`;
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" font-family="Fredoka, 'Comic Sans MS', 'Segoe UI', sans-serif">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FDF3DB"/><stop offset="1" stop-color="#F0DDBB"/></linearGradient>
  <linearGradient id="btn" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#4CA818"/><stop offset="1" stop-color="#1D7302"/></linearGradient>
  <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#145200" flood-opacity=".18"/></filter>
</defs>
<rect width="1200" height="760" fill="url(#bg)"/>
<text x="60" y="80" font-size="52">ðŸŒ²</text><text x="1090" y="100" font-size="60">ðŸŒ³</text>
<text x="1120" y="690" font-size="42">ðŸ„</text><text x="70" y="700" font-size="34">ðŸƒ</text>

<!-- MENU -->
<g filter="url(#sh)"><rect x="50" y="96" width="640" height="580" rx="36" fill="#FDF3DB" stroke="#C58153" stroke-width="5"/></g>
<rect x="50" y="96" width="640" height="12" rx="6" fill="#1D7302"/>
<text x="370" y="180" text-anchor="middle" font-size="52">ðŸŒ² ðŸŒ³</text>
<text x="370" y="212" text-anchor="middle" font-size="14" font-weight="700" letter-spacing="3" fill="#804020">ðŸ¾ AYO BERTUALANG ðŸ¾</text>
<text x="370" y="270" text-anchor="middle" font-size="46" font-weight="700" fill="#804020">Petualangan <tspan fill="#1D7302">Hutan</tspan></text>
<text x="370" y="310" text-anchor="middle" font-size="16" fill="#A07150">Main Ular Tangga bersama teman-teman hutan!<br/>Naik tangga, hindari ular, dan capai garis finish.</text>
<g filter="url(#sh)"><rect x="220" y="340" width="300" height="86" rx="24" fill="url(#btn)"/></g>
<text x="370" y="383" text-anchor="middle" font-size="40" font-weight="700" letter-spacing="3" fill="#FDF3DB">PLAY</text>
<text x="370" y="410" text-anchor="middle" font-size="14" font-weight="600" fill="#FDF3DB">Yuk, mulai sekarang!</text>
<text x="370" y="470" text-anchor="middle" font-size="34" letter-spacing="10">ðŸ» ðŸ¦Š ðŸ° ðŸ¦‰ ðŸ¸</text>
<text x="370" y="535" text-anchor="middle" font-size="12" fill="#A07150">2 Â· 3 Â· 4 pemain â€” isi nama & pilih karakter</text>


<!-- GAME (pratinjau) -->
<g filter="url(#sh)"><rect x="720" y="96" width="430" height="580" rx="30" fill="#fff"/></g>
<image href="assets/snake-icon.png" x="895" y="106" width="30" height="30"/><text x="950" y="132" text-anchor="middle" font-size="20" font-weight="700" fill="#1D7302">Ular Tangga Hutan</text>
<g filter="url(#sh)"><rect x="${BX - 6}" y="${BY - 6}" width="${W + 12}" height="${H + 12}" rx="18" fill="#FDF3DB" stroke="#fff" stroke-width="5"/></g>
${cells}${lines}${pawn(5, "#C98A5E", "ðŸ»", -6)}${pawn(12, "#E08A55", "ðŸ¦Š", 6)}
<!-- dadu dengan angka besar -->
<rect x="905" y="588" width="60" height="60" rx="16" fill="#FFFDF5" stroke="#C58153" stroke-width="2"/>
<text x="935" y="632" text-anchor="middle" font-size="42" font-weight="700" fill="#145200">5</text>
<text x="935" y="670" text-anchor="middle" font-size="12" fill="#A07150">Angka dadu: <tspan font-weight="700" fill="#1D7302">5</tspan></text>
<text x="600" y="728" text-anchor="middle" font-size="12" fill="#A07150">Mockup desain baru â€” papan 100 kotak, tema hutan, dadu dengan angka jelas</text>
</svg>`;

fs.writeFileSync(__dirname + "/mockup.svg", svg, "utf8");
console.log("Mockup dibuat: mockup.svg");

