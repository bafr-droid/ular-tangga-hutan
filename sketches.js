/* ============================================================
   Sketsa SVG sederhana untuk soal "Tebak Gambar".
   Dipakai oleh quiz modal melalui window.getSketch(deskripsi).
   ============================================================ */
(() => {
  const C = {
    stroke: "#804020", green: "#1D7302", leaf: "#57A32A",
    bark: "#C58153", red: "#D96C5F", sun: "#F2B45A", cream: "#FDF3DB",
  };

  const g = (body) => `<g stroke="${C.stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none">${body}</g>`;

  function person(x, base = 124, s = 1, shirt = C.bark) {
    return `<g transform="translate(${x} ${base}) scale(${s})" stroke="${C.stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="0" cy="-52" r="10" fill="#F7D9B5"/>
      <path d="M0 -42 V-18 M0 -34 L-13 -25 M0 -34 L13 -25 M0 -18 L-10 0 M0 -18 L10 0" fill="none"/>
      <path d="M-9 -40 Q0 -46 9 -40 L7 -18 L-7 -18 Z" fill="${shirt}" stroke="${C.stroke}"/>
    </g>`;
  }

  function ground(extra = "") {
    return `<path d="M14 124 H226" stroke="#A7CE7A" stroke-width="3" stroke-linecap="round"/>${extra}`;
  }

  function box(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})" stroke="${C.stroke}" stroke-width="2.2" fill="#E8C79F">
      <rect x="0" y="0" width="30" height="26" rx="3"/>
      <path d="M0 9 H30 M15 0 V26" fill="none"/>
    </g>`;
  }

  function fish(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})" stroke="${C.stroke}" stroke-width="2.2" fill="#9BD1C0">
      <path d="M0 0 Q18 -16 38 0 Q18 16 0 0 Z"/>
      <path d="M0 0 L-14 -11 L-11 0 L-14 11 Z" fill="#48B088"/>
      <circle cx="28" cy="-3" r="1.8" fill="${C.stroke}" stroke="none"/>
    </g>`;
  }

  function truck() {
    return g(`
      <path d="M28 96 H150 V62 H112 V44 H60 V62 H28 Z" fill="#E8C79F"/>
      <path d="M112 62 H150 V96 H112 Z" fill="#F7D9B5"/>
      <path d="M120 70 H142 M120 80 H142" />
      <circle cx="62" cy="100" r="11" fill="#5A4636"/>
      <circle cx="132" cy="100" r="11" fill="#5A4636"/>
      <circle cx="62" cy="100" r="3" fill="${C.cream}"/>
      <circle cx="132" cy="100" r="3" fill="${C.cream}"/>
      <circle cx="84" cy="56" r="9" fill="#F7D9B5"/>
      <path d="M84 47 V38 M74 42 H94" stroke="${C.green}"/>
    `);
  }

  function bread(x = 150, y = 92) {
    return `<g transform="translate(${x} ${y})" stroke="${C.stroke}" stroke-width="2.2" fill="#F2C98A">
      <path d="M0 0 Q0 -22 22 -22 Q44 -22 44 0 Z"/>
      <path d="M10 -8 L15 -16 M22 -10 L22 -19 M34 -8 L29 -16"/>
    </g>`;
  }

  function shoe(x = 150, y = 116) {
    return `<g transform="translate(${x} ${y})" stroke="${C.stroke}" stroke-width="2.2" fill="#8B5E3C">
      <path d="M-22 0 Q-22 -16 -8 -18 L0 -4 Q10 -16 26 -10 Q34 -4 34 0 Z"/>
      <path d="M-22 0 H34"/>
    </g>`;
  }

  function book(x = 135, y = 112) {
    return `<g transform="translate(${x} ${y})" stroke="${C.stroke}" stroke-width="2.2" fill="#FDF3DB">
      <rect x="-26" y="-30" width="52" height="34" rx="3"/>
      <path d="M-18 -22 H16 M-18 -14 H10"/>
      <path d="M22 -34 L34 -22 M20 -30 L30 -20" stroke="${C.green}" stroke-width="3"/>
    </g>`;
  }

  function pencil(x = 175, y = 108) {
    return `<g transform="translate(${x} ${y}) rotate(-28)" stroke="${C.stroke}" stroke-width="2" fill="${C.sun}">
      <rect x="-4" y="-34" width="8" height="38" rx="1.5"/>
      <path d="M-4 4 L0 12 L4 4 Z" fill="#F7D9B5"/>
    </g>`;
  }

  function plant(x, y) {
    return `<g transform="translate(${x} ${y})" stroke="${C.green}" stroke-width="2" fill="none">
      <path d="M0 0 V-14 M0 -8 L-7 -14 M0 -8 L7 -14 M0 -12 L-5 -19 M0 -12 L5 -19"/>
    </g>`;
  }

  function riceField() {
    let out = "";
    for (let i = 0; i < 6; i++) out += plant(130 + i * 17, 122 - (i % 2) * 4);
    return out;
  }

  function stall() {
    return g(`
      <path d="M120 52 H222 L210 68 H132 Z" fill="${C.red}" stroke="${C.red}"/>
      <path d="M132 68 V122 M210 68 V122"/>
      <path d="M128 96 H214" />
      <circle cx="148" cy="88" r="9" fill="${C.green}"/>
      <circle cx="170" cy="88" r="9" fill="#E46F4F"/>
      <circle cx="192" cy="88" r="9" fill="${C.sun}"/>
    `);
  }

  function cow() {
    return g(`
      <path d="M130 92 Q130 70 156 70 H188 Q206 70 206 92 V112 H130 Z" fill="#FDF3DB"/>
      <circle cx="196" cy="86" r="3" fill="${C.stroke}" stroke="none"/>
      <path d="M206 84 L218 78 M206 90 L218 94" />
      <path d="M142 112 V122 M192 112 V122"/>
      <path d="M150 112 Q152 122 160 122 M176 112 Q178 122 186 122"/>
      <path d="M156 70 L150 60 M188 70 L194 60"/>
    `);
  }

  function pot(x = 148, y = 116) {
    return g(`
      <path d="M${x} ${y} H${x + 56} L${x + 48} ${y - 26} H${x + 8} Z" fill="#9BA9A0"/>
      <path d="M${x + 4} ${y - 26} H${x + 52}" stroke-width="4"/>
      <path d="M${x + 18} ${y - 34} Q${x + 12} ${y - 44} ${x + 22} ${y - 50}" stroke="#B8C7BE"/>
      <path d="M${x + 36} ${y - 34} Q${x + 30} ${y - 44} ${x + 40} ${y - 50}" stroke="#B8C7BE"/>
    `);
  }

  function bus() {
    return g(`
      <rect x="96" y="58" width="118" height="52" rx="8" fill="${C.sun}"/>
      <path d="M108 66 H142 V84 H108 Z M152 66 H202 V84 H152 Z" fill="#DCEAF0"/>
      <circle cx="122" cy="112" r="10" fill="#5A4636"/>
      <circle cx="188" cy="112" r="10" fill="#5A4636"/>
      <path d="M96 96 H214"/>
    `);
  }

  function motorcycle() {
    return g(`
      <circle cx="96" cy="106" r="16"/>
      <circle cx="176" cy="106" r="16"/>
      <path d="M96 106 L124 78 H158 L176 106 M124 78 L112 106 M158 78 L176 106"/>
      <path d="M124 78 L116 68 H148" />
      <circle cx="130" cy="60" r="9" fill="#F7D9B5"/>
      <path d="M130 51 V42 M120 46 H140"/>
    `);
  }

  function chair() {
    return g(`
      <path d="M152 60 H190 V100 H152 Z" fill="#C98A5E"/>
      <path d="M148 100 H194 V106 H148 Z" fill="#C98A5E"/>
      <path d="M154 106 V124 M188 106 V124"/>
      <path d="M156 72 H186 M156 84 H186"/>
    `);
  }

  function shirt() {
    return g(`
      <path d="M104 60 L126 48 Q140 60 154 48 L176 60 L166 80 L158 74 V116 H122 V74 L114 80 Z" fill="#8FBF6A"/>
      <path d="M126 48 Q140 66 154 48"/>
      <circle cx="140" cy="86" r="3" fill="${C.cream}"/>
      <circle cx="140" cy="100" r="3" fill="${C.cream}"/>
    `);
  }

  function medicine() {
    return g(`
      <path d="M150 74 H182 V116 H150 Z" fill="#DCEAF0"/>
      <path d="M156 74 V64 H176 V74" />
      <path d="M166 84 V106 M155 95 H177" stroke="${C.red}" stroke-width="4"/>
      <path d="M118 60 H142 V118 H118 Z" fill="${C.cream}"/>
      <path d="M126 60 V52 H134 V60" />
    `);
  }

  const scenes = [
    [["petani", "menanam", "padi"], () => person(70) + riceField() + `<circle cx="44" cy="36" r="12" fill="${C.sun}" stroke="none"/>`],
    [["sopir", "truk", "mengirim", "mengangkut"], () => truck() + box(40, 92, .8)],
    [["anak", "makan roti"], () => person(70) + bread(135, 108)],
    [["ikan hasil", "ikan"], () => fish(110, 88, 1.6) + fish(150, 112, 1.1)],
    [["nelayan"], () => person(84) + g(`<path d="M98 88 L150 40 M150 40 L166 78"/>`) + fish(168, 96, .9)],
    [["cukur", "rambut"], () => person(84) + g(`<circle cx="162" cy="70" r="6"/><circle cx="178" cy="70" r="6"/><path d="M166 74 L186 94 M178 74 L158 94"/>`)],
    [["kurir", "paket"], () => person(84) + box(118, 82, 1.1)],
    [["pensil", "menulis"], () => person(70) + book(150, 116) + pencil(190, 104)],
    [["sepatu", "pabrik"], () => person(70) + shoe(160, 116) + g(`<path d="M126 46 H216 V62 M126 62 H216"/>`)],
    [["pedagang", "sayuran", "pasar"], () => stall() + person(86)],
    [["dokter", "pasien"], () => person(70, 124, 1, "#DCEAF0") + g(`<path d="M70 82 H94 M82 70 V94" stroke="${C.red}" stroke-width="3"/>`) + g(`<path d="M132 112 H210 M144 100 H198" stroke-width="5"/><circle cx="206" cy="96" r="8" fill="#F7D9B5"/>`)],
    [["nasi"], () => g(`<ellipse cx="140" cy="106" rx="52" ry="14" fill="#EDEDED"/><path d="M100 104 Q140 62 180 104 Z" fill="#FFFFFF"/><path d="M112 98 Q140 74 168 98" stroke="#E0E0E0"/>`)],
    [["minum air"], () => person(70) + g(`<path d="M132 86 H156 L152 122 H136 Z" fill="#DCEAF0" stroke="${C.stroke}"/><path d="M136 100 H152" stroke="#8FC7D8"/>`)],
    [["buku tulis"], () => book(140, 116) + pencil(190, 106)],
    [["ojek", "penumpang"], () => motorcycle()],
    [["membuat roti", "roti"], () => person(70) + bread(150, 108) + g(`<rect x="120" y="52" width="70" height="54" rx="6"/><path d="M132 66 H178"/>`)],
    [["membeli makanan", "kantin"], () => g(`<path d="M120 90 H222 V124 H120 Z" fill="#E8C79F"/><path d="M128 90 V68 H214 V90"/>`) + person(80) + g(`<rect x="146" y="74" width="34" height="14" rx="2" fill="${C.cream}"/>`) + bread(150, 86)],
    [["pakaian", "baju"], () => shirt()],
    [["sapi", "susu"], () => cow() + person(92) + g(`<path d="M162 116 V128 M176 116 V128"/><path d="M154 126 H186" stroke-width="4"/>`)],
    [["memasak", "sayur"], () => person(70) + pot(140, 116)],
    [["tukang kayu", "kursi"], () => chair() + person(92) + g(`<path d="M104 84 L128 60 M128 60 L140 72 M128 60 L116 60" stroke-width="3"/>`)],
    [["bus"], () => bus() + person(120, 74, .62) + person(170, 74, .62)],
    [["anyaman", "bambu"], () => g(`<rect x="126" y="76" width="86" height="40" rx="4" fill="#E7C98A"/><path d="M126 88 H212 M126 100 H212 M142 76 V116 M158 76 V116 M174 76 V116 M190 76 V116 M206 76 V116"/>`) + person(88)],
    [["obat", "apotek"], () => medicine() + g(`<path d="M196 56 H222 M209 43 V69" stroke="${C.green}" stroke-width="4"/>`) + person(88)],
    [["petani, pedagang", "pembeli"], () => person(64) + person(124, 124, 1, C.green) + person(184, 124, 1, "#9BA9A0") + g(`<circle cx="124" cy="104" r="10" fill="${C.sun}"/><circle cx="142" cy="106" r="8" fill="${C.green}"/>`)],
  ];

  window.getSketch = function (description) {
    const d = String(description || "").toLowerCase();
    let inner = null;
    for (const [keys, make] of scenes) {
      if (keys.some((k) => d.includes(k))) { inner = make(); break; }
    }
    if (!inner) {
      inner = g(`<circle cx="120" cy="72" r="24"/><path d="M112 66 Q120 56 128 66 Q128 76 120 80 M120 88 V94"/>`);
    }
    return `<svg class="sketch-svg" viewBox="0 0 240 140" role="img" aria-label="Sketsa ${String(description || "").replace(/"/g, "&quot;")}">
      <rect x="2" y="2" width="236" height="136" rx="16" fill="${C.cream}" stroke="#D9A57F" stroke-width="2"/>
      ${ground()}${inner}
    </svg>`;
  };
})();
