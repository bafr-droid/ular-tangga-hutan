/* ============================================================
   script.js — OTAK GAME
   Alur: menu → pilih jumlah pemain → setup → game → soal → menang
   ------------------------------------------------------------
   PANDUAN EDIT CEPAT (baris):
     ~11  LADDERS / SNAKES  : peta tangga & ular
     ~15  CHARACTERS        : daftar karakter (emoji + warna)
     ~23  PIPS              : titik yang menyala di dadu
     ~64  questionSeconds   : durasi timer default (30)
     ~110 Soal & skor       : 2 benar +15, 1 benar +5, 0 benar -5, finish +100
     ~77  bgMusic           : musik latar dari assets/Bg-Music.mp4 + slider volume
     ~950 Rekam gameplay    : tombol ⏺️, auto-stop + download saat menang
     ~430 Timer soal        : hitung mundur & waktu habis
     ~490 Gambar soal       : pakai file custom, fallback SVG
     ~660 Aturan dadu       : kelebihan langkah dipantulkan
     ~740 Tangga/ular       : naik/turun hanya jika benar semua

   File terkait (bukan di sini):
     questions.js             → bank soal (auto-generated)
     sketches.js              → sketsa SVG bawaan
     assets/sketches/*.js     → gambar buatan Anda
   ============================================================ */
(() => {
  "use strict";

  // Papan 10 kolom × 10 baris = 100 kotak. Finish ada di kotak 100.
  // Tidak disarankan mengubah COLS/ROWS kecuali papan ikut digambar ulang.
  const COLS = 10, ROWS = 10, LAST = COLS * ROWS;

  // PETA TANGGA & Ular dari file PDF.
  // Format: { kotakAwal: kotakTujuan }
  //   LADDERS → naik dari kunci ke nilai
  //   SNAKES  → turun dari kunci ke nilai (kunci = kepala ular)
  // Contoh: 4:25 artinya berhenti di kotak 4 → naik ke 25.
  const LADDERS = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81 };
  const SNAKES  = { 27: 7, 40: 18, 54: 31, 66: 45, 89: 53, 96: 74 };

  // KARAKTER PEMAIN. Tambah/buang entri di sini untuk mengubah pilihan.
  // name  = nama saat hover
  // emoji = bidak di papan
  // color = warna bidak & kartu pemain
  // ring  = warna lingkaran saat giliran aktif
  const CHARACTERS = [
    { name: "Beruang",   emoji: "🐻", color: "#C98A5E", ring: "#C98A5E" },
    { name: "Rubah",     emoji: "🦊", color: "#E08A55", ring: "#E08A55" },
    { name: "Kelinci",   emoji: "🐰", color: "#C9A7C7", ring: "#C9A7C7" },
    { name: "Burung Hantu", emoji: "🦉", color: "#9A7B5F", ring: "#9A7B5F" },
    { name: "Kodok",     emoji: "🐸", color: "#7FB069", ring: "#7FB069" },
  ];

  // POLA TITIK DADU. Angka 0-8 = posisi grid 3×3 (0=kiri atas, 8=kanan bawah).
  // Catatan: indeks 4 = tengah, indeks 8 = kanan bawah. Boleh diubah.
  const PIPS = {
    1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (id) => document.getElementById(id);

  // --- Elemen ---
  const screens     = [...document.querySelectorAll(".screen")];
  const countGrid   = $("countGrid");
  const setupList   = $("setupList");
  const playersEl   = $("players");
  const board       = $("board");
  const links       = $("links");
  const dieEl       = $("die");
  const pips        = [...dieEl.querySelectorAll(".pip")];
  const dieNumber   = $("dieNumber");
  const diceReadout = $("diceReadout");
  const rollBtn     = $("rollBtn");
  const turnNameEl  = $("turnName");
  const turnPillEl  = $("turnPill");
  const messageEl   = $("message");
  const soundBtn    = $("soundBtn");
  const recordBtn   = $("recordBtn");    // tombol ⏺️ / ⏹️ rekam gameplay
  const bgMusic     = $("bgMusic");      // elemen <audio> musik latar (di index.html)
  const musicToggle = $("musicToggle");  // tombol ▶/⏸ putar/jeda
  const musicVolume = $("musicVolume");  // slider 0-100
  const musicValue  = $("musicValue");   // label persentase
  const musicHint   = $("musicHint");    // petunjuk kalau autoplay diblokir
  const winModal    = $("winModal");
  const confettiEl  = $("confetti");

  // --- STATE (data yang berubah saat game berjalan) ---
  let playerCount = 2;
  let configs = [];        // hasil setup: { name, charIndex }
  let players = [];        // pemain aktif di game
  let current = 0;
  let rolling = false;
  let finished = false;
  let muted = false;
  let cellMap = new Map();
  let audioCtx = null;
  let usedBoxes = new Set();      // kotak soal yang sudah dipakai (anti-ulang)
  let quizResolver = null;        // fungsi untuk melanjutkan game setelah soal selesai
  let quizAnswers = [];           // jawaban 2 soal: "", "Benar", "A", atau "__timeout__"
  let currentQuizBox = null;      // kotak soal yang sedang tampil
  let questionSeconds = 30;       // DEFAULT timer. Diubah dari tombol di layar jumlah pemain.
  let questionTimers = [];        // kumpulan interval JS untuk hitung mundur
  let musicWanted = true;         // keinginan pengguna: true = musik boleh bunyi
  let volumeLevel = 35;           // volume slider 0-100 persen (default 35)
  let waitingGesture = false;     // penanda sedang menunggu klik pertama
  let recorder = null;            // MediaRecorder untuk rekam gameplay
  let recordStream = null;        // stream dari getDisplayMedia (tab browser)
  let recordChunks = [];          // potongan video yang terkumpul
  let recording = false;          // status sedang merekam atau tidak

  /* ---------------- Navigasi layar ---------------- */
  function showScreen(id) {
    screens.forEach((s) => s.classList.toggle("active", s.id === id));
    window.scrollTo({ top: 0, behavior: "instant" });
    if (id === "gameScreen") setTimeout(drawLinks, 60);
  }

  /* ---------------- Langkah 1: pilih jumlah ---------------- */
  countGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".count-card");
    if (!card) return;
    playerCount = Number(card.dataset.count);
    configs = Array.from({ length: playerCount }, (_, i) => ({ name: "", charIndex: i }));
    renderSetup();
    showScreen("setupScreen");
  });

  // Klik tombol durasi (15/30/45/60/Mati). data-seconds dibaca dari HTML.
  $("timerOptions").addEventListener("click", (e) => {
    const btn = e.target.closest(".timer-option");
    if (!btn) return;
    questionSeconds = Number(btn.dataset.seconds) || 0;
    $("timerOptions").querySelectorAll(".timer-option").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("selected", on);
      b.setAttribute("aria-pressed", String(on));
    });
    tone(660, .06);
  });

  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.back));
  });

  /* ---------------- Langkah 2: setup tiap pemain ---------------- */
  function renderSetup() {
    setupList.innerHTML = "";
    const taken = configs.map((c) => c.charIndex);

    configs.forEach((cfg, i) => {
      const row = document.createElement("div");
      row.className = "setup-row";

      const number = document.createElement("div");
      number.className = "player-number";
      number.textContent = i + 1;

      const field = document.createElement("div");
      field.className = "name-field";
      field.innerHTML = `<label for="name-${i}">Nama Pemain ${i + 1}</label>`;
      const input = document.createElement("input");
      input.id = `name-${i}`;
      input.type = "text";
      input.maxLength = 18;
      input.placeholder = `Pemain ${i + 1}`;
      input.value = cfg.name;
      input.autocomplete = "off";
      input.addEventListener("input", () => { configs[i].name = input.value; });
      field.appendChild(input);

      const picker = document.createElement("div");
      picker.className = "char-picker";
      picker.setAttribute("role", "group");
      picker.setAttribute("aria-label", `Pilih karakter pemain ${i + 1}`);
      CHARACTERS.forEach((ch, ci) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "char-option" + (cfg.charIndex === ci ? " selected" : "");
        btn.textContent = ch.emoji;
        btn.title = ch.name;
        btn.setAttribute("aria-label", ch.name);
        btn.setAttribute("aria-pressed", String(cfg.charIndex === ci));
        btn.disabled = taken.includes(ci) && cfg.charIndex !== ci;
        btn.addEventListener("click", () => {
          configs[i].charIndex = ci;
          renderSetup();
          const nextInput = $(`name-${i}`);
          if (nextInput) nextInput.focus();
        });
        picker.appendChild(btn);
      });

      row.append(number, field, picker);
      setupList.appendChild(row);
    });
  }

  $("startBtn").addEventListener("click", () => {
    players = configs.map((cfg, i) => {
      const ch = CHARACTERS[cfg.charIndex];
      return {
        ...ch,
        index: i,
        name: cfg.name.trim() || `Pemain ${i + 1}`,
        pos: 0,
        score: 0,
        el: null,
      };
    });
    showScreen("gameScreen");
    setupGame();
  });

  /* ---------------- Papan ---------------- */
  function insertCells() {
    const frag = document.createDocumentFragment();
    cellMap = new Map();
    for (let row = 0; row < ROWS; row++) {
      const fromBottom = ROWS - 1 - row;
      const base = fromBottom * COLS;
      for (let col = 0; col < COLS; col++) {
        // Baris genap dari bawah: kiri → kanan; baris ganjil: kanan → kiri
        const num = fromBottom % 2 === 0 ? base + col + 1 : base + COLS - col;
        const cell = document.createElement("div");
        cell.className = "cell";
        if ((row + col) % 2 === 0) cell.classList.add("dark");
        if (LADDERS[num]) cell.classList.add("ladder");
        if (SNAKES[num]) cell.classList.add("snake");
        if (num === LAST) cell.classList.add("finish");

        const label = document.createElement("span");
        label.textContent = num;
        cell.appendChild(label);

        if (LADDERS[num] || SNAKES[num]) {
          const badge = document.createElement("span");
          badge.className = "badge";
          const isLadder = Boolean(LADDERS[num]);
          badge.textContent = isLadder ? "🪜" : "🐍";
          const target = document.createElement("small");
          target.textContent = `→${isLadder ? LADDERS[num] : SNAKES[num]}`;
          badge.appendChild(target);
          cell.appendChild(badge);
        }
        cell.dataset.num = String(num);
        cellMap.set(num, cell);
        frag.appendChild(cell);
      }
    }
    board.appendChild(frag);
  }

  function coordsOf(num) {
    if (num <= 0) return null;
    const fromBottom = Math.ceil(num / COLS) - 1;
    const row = ROWS - 1 - fromBottom;
    const idx = (num - 1) % COLS;
    const col = fromBottom % 2 === 0 ? idx : COLS - 1 - idx;
    return { row, col };
  }

  // MENGGAMBAR TANGGA & Ular sebagai SVG di atas papan.
  // Dipanggil ulang saat layar muncul, jendela diubah, dan font siap.
  // Warna ditulis di ladderSvg()/snakeSvg() di bawah (baris ~285-330).
  function drawLinks() {
    const rect = board.getBoundingClientRect();
    if (!rect.width || cellMap.size === 0) return;
    links.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    links.innerHTML = "";

    const unit = rect.width / COLS;
    const centerOf = (num) => {
      const r = cellMap.get(num).getBoundingClientRect();
      return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
    };

    // Kurva quadratic + titik & arah di sepanjang kurva
    function makeCurve(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(len * .16, unit * .55);
      const c = {
        x: (a.x + b.x) / 2 - (dy / len) * bend,
        y: (a.y + b.y) / 2 + (dx / len) * bend,
      };
      const at = (t) => ({
        x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
        y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
      });
      const dir = (t) => {
        const vx = 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x);
        const vy = 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y);
        const l = Math.hypot(vx, vy) || 1;
        return { tx: vx / l, ty: vy / l, nx: -vy / l, ny: vx / l };
      };
      const d = `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      return { d, at, dir, a, b, len };
    }

    function offsetPath(curve, offset) {
      const steps = 20;
      let d = "";
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, p = curve.at(t), n = curve.dir(t);
        d += `${i === 0 ? "M" : "L"} ${(p.x + n.nx * offset).toFixed(1)} ${(p.y + n.ny * offset).toFixed(1)} `;
      }
      return d.trim();
    }

    // Tangga: dua rel #C58153 + anak tangga #804020 (tanpa panah/dash).
    function ladderSvg(curve) {
      const gap = unit * .16;
      const railW = Math.max(2, unit * .055);
      const rungW = Math.max(1.6, unit * .045);
      const rungs = Math.max(3, Math.min(6, Math.round(curve.len / (unit * .26))));
      let s = "";
      s += `<path class="ladder-rail" d="${offsetPath(curve, -gap / 2)}" stroke="#C58153" stroke-width="${railW.toFixed(1)}"/>`;
      s += `<path class="ladder-rail" d="${offsetPath(curve, gap / 2)}" stroke="#C58153" stroke-width="${railW.toFixed(1)}"/>`;
      for (let i = 1; i <= rungs; i++) {
        const t = .12 + (i / (rungs + 1)) * .76;
        const p = curve.at(t), n = curve.dir(t), h = gap / 2;
        s += `<line class="ladder-rung" x1="${(p.x + n.nx * h).toFixed(1)}" y1="${(p.y + n.ny * h).toFixed(1)}" x2="${(p.x - n.nx * h).toFixed(1)}" y2="${(p.y - n.ny * h).toFixed(1)}" stroke="#804020" stroke-width="${rungW.toFixed(1)}"/>`;
      }
      return s;
    }

    // Ular: badan melengkung #48B088, tepi #1D7302, sisik,
    // dan kepala oval + mata + lidah di kotak awal turun.
    function snakeSvg(curve) {
      const bodyW = Math.max(4, unit * .13);
      const outlineW = bodyW + Math.max(1.5, unit * .035);
      const scales = Math.max(3, Math.min(8, Math.round(curve.len / (unit * .22))));
      let s = "";
      s += `<path class="snake-body-outline" d="${curve.d}" stroke="#1D7302" stroke-width="${outlineW.toFixed(1)}"/>`;
      s += `<path class="snake-body" d="${curve.d}" stroke="#48B088" stroke-width="${bodyW.toFixed(1)}"/>`;
      for (let i = 0; i < scales; i++) {
        const t = .12 + (i / (scales + 1)) * .74;
        const p = curve.at(t), n = curve.dir(t), h = bodyW * .32;
        s += `<line class="snake-scale" x1="${(p.x + n.nx * h).toFixed(1)}" y1="${(p.y + n.ny * h).toFixed(1)}" x2="${(p.x - n.nx * h).toFixed(1)}" y2="${(p.y - n.ny * h).toFixed(1)}"/>`;
      }
      // Kepala oval di titik awal turun (bukan tujuan)
      const headDir = curve.dir(0);
      const angle = (Math.atan2(headDir.ty, headDir.tx) * 180 / Math.PI) + 180;
      const rx = unit * .20, ry = unit * .14;
      const eye = unit * .035, pupil = unit * .016, snout = unit * .19;
      s += `<g class="snake-head-shape" transform="translate(${curve.a.x.toFixed(1)} ${curve.a.y.toFixed(1)}) rotate(${angle.toFixed(1)})">`;
      s += `<ellipse cx="0" cy="0" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#48B088" stroke="#1D7302" stroke-width="${Math.max(1, unit * .03).toFixed(1)}"/>`;
      for (const sign of [-1, 1]) {
        s += `<circle cx="${(unit * .08).toFixed(1)}" cy="${(sign * unit * .06).toFixed(1)}" r="${eye.toFixed(1)}" fill="#FDF3DB" stroke="#1D7302" stroke-width=".8"/>`;
        s += `<circle cx="${(unit * .095).toFixed(1)}" cy="${(sign * unit * .06).toFixed(1)}" r="${pupil.toFixed(1)}" fill="#145200"/>`;
      }
      s += `<path d="M ${snout.toFixed(1)} 0 q ${(unit * .10).toFixed(1)} ${(-unit * .03).toFixed(1)} ${(unit * .14).toFixed(1)} ${(-unit * .07).toFixed(1)} M ${snout.toFixed(1)} 0 q ${(unit * .10).toFixed(1)} ${(unit * .03).toFixed(1)} ${(unit * .14).toFixed(1)} ${(unit * .07).toFixed(1)}" stroke="#D96C5F" stroke-width="${Math.max(1, unit * .025).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
      s += `</g>`;
      return s;
    }

    let out = "";
    for (const [f, t] of Object.entries(LADDERS)) {
      out += ladderSvg(makeCurve(centerOf(+f), centerOf(t)));
    }
    for (const [f, t] of Object.entries(SNAKES)) {
      out += snakeSvg(makeCurve(centerOf(+f), centerOf(t)));
    }
    links.insertAdjacentHTML("beforeend", out);
  }

  /* ---------------- Game ---------------- */
  function setupGame() {
    current = 0;
    rolling = false;
    finished = false;
    usedBoxes = new Set();
    clearQuestionTimers();
    winModal.hidden = true;
    $("quizModal").hidden = true;
    clearConfetti();
    setDieFace(1);
    rollBtn.disabled = false;
    renderPlayers();
    renderPawns();
    updateTurn();
    say("👋", "Siap bertualang? Lempar dadu dulu, yuk!");
    requestAnimationFrame(drawLinks);
    setTimeout(drawLinks, 60);
  }

  function renderPlayers() {
    playersEl.innerHTML = "";
    players.forEach((p) => {
      const row = document.createElement("div");
      row.className = "player" + (p.index === current && !finished ? " active" : "");
      row.style.setProperty("--player-color", p.color);
      row.innerHTML = `
        <span class="player-avatar">${p.emoji}</span>
        <span class="player-info">
          <span class="player-name"></span>
          <span class="player-pos" data-pos="${p.index}">Di awal 🚩</span>
        </span>
        <span class="player-score" data-score="${p.index}">⭐ 0</span>
        <span class="player-check">👉</span>`;
      row.querySelector(".player-name").textContent = p.name;
      row.querySelector(".player-score").textContent = `⭐ ${p.score}`;
      playersEl.appendChild(row);
    });
  }

  function renderPawns() {
    board.querySelectorAll(".pawn").forEach((el) => el.remove());
    players.forEach((p) => {
      const pawn = document.createElement("div");
      pawn.className = "pawn" + (p.index === current && !finished ? " active" : "");
      pawn.style.setProperty("--pawn-bg", p.color);
      pawn.style.setProperty("--ring", p.ring);
      pawn.textContent = p.emoji;
      pawn.setAttribute("aria-label", `${p.name}, posisi ${p.pos}`);
      positionPawn(p, pawn);
      board.appendChild(pawn);
      p.el = pawn;
    });
  }

  function positionPawn(player, pawn = player.el) {
    if (!pawn) return;
    if (player.pos === 0) {
      pawn.style.left = `${5 + player.index * (80 / Math.max(players.length - 1, 1))}%`;
      pawn.style.top = `${103 + (player.index % 2) * 2}%`;
    } else {
      const { row, col } = coordsOf(player.pos);
      pawn.style.left = `${(col + .5) * (100 / COLS)}%`;
      pawn.style.top = `${(row + .5) * (100 / ROWS)}%`;
    }
  }

  function updateTurn() {
    const p = players[current];
    turnNameEl.textContent = p.name;
    turnPillEl.textContent = finished ? "Selesai 🎉" : `Giliran ${current + 1}/${players.length}`;
    playersEl.querySelectorAll(".player").forEach((el, i) => el.classList.toggle("active", i === current && !finished));
    board.querySelectorAll(".pawn").forEach((el, i) => el.classList.toggle("active", i === current && !finished));
    playersEl.querySelectorAll("[data-pos]").forEach((el) => {
      const pl = players[Number(el.dataset.pos)];
      el.textContent = pl.pos === 0 ? "Di awal 🚩" : `Kotak ${pl.pos} / ${LAST}`;
    });
    playersEl.querySelectorAll("[data-score]").forEach((el) => {
      el.textContent = `⭐ ${players[Number(el.dataset.score)].score}`;
    });
  }

  function say(emoji, text) {
    messageEl.innerHTML = "";
    const e = document.createElement("span");
    e.className = "message-emoji";
    e.textContent = emoji;
    const t = document.createElement("span");
    t.textContent = text;
    messageEl.append(e, t);
  }

  /* ---------------- TIMER TIAP SOAL ----------------
     3 fungsi di bawah mengatur hitung mundur:
       clearQuestionTimers() → matikan semua interval (dipakai saat ganti soal/kirim)
       stopQuestionTimer()   → hentikan 1 soal, tulis label "✓ Terjawab" / "Waktu habis!"
       timeoutQuestion()     → tandai salah, matikan tombol, auto-kirim bila keduanya habis
     Sisa ≤ 5 detik → class .urgent (bar jadi merah, di style.css). */
  function clearQuestionTimers() {
    questionTimers.forEach((t) => clearInterval(t.interval));
    questionTimers = [];
  }

  function stopQuestionTimer(qi, label) {
    const t = questionTimers.find((x) => x.qi === qi);
    if (t) {
      clearInterval(t.interval);
      questionTimers = questionTimers.filter((x) => x !== t);
    }
    const el = document.querySelector(`.q-timer[data-timer="${qi}"]`);
    if (el) {
      if (label) el.querySelector(".q-timer-text").textContent = label;
      el.classList.remove("urgent");
    }
    return el;
  }

  function timeoutQuestion(qi) {
    if (quizAnswers[qi]) return;
    quizAnswers[qi] = "__timeout__";
    const el = stopQuestionTimer(qi, "Waktu habis!");
    if (el) {
      el.querySelector(".q-timer-bar i").style.width = "0%";
      const item = el.closest(".q-item");
      item.classList.add("timeout");
      item.querySelectorAll(".q-opt").forEach((b) => { b.disabled = true; });
      if (!item.querySelector(".q-timeout-note")) {
        const note = document.createElement("p");
        note.className = "q-timeout-note";
        note.textContent = "⏰ Waktu habis! Jawaban dianggap salah.";
        item.appendChild(note);
      }
    }
    $("quizSubmit").disabled = quizAnswers.some((a) => !a);
    tone(200, .15, "square", .05);
    if (quizAnswers.every((a) => a === "__timeout__") && quizResolver) {
      setTimeout(() => {
        if (!document.getElementById("quizModal").hidden && quizResolver &&
            quizAnswers.every((a) => a === "__timeout__")) $("quizSubmit").click();
      }, 500);
    }
  }

  function startQuestionTimers() {
    clearQuestionTimers();
    if (!questionSeconds) return;
    const endAt = Date.now() + questionSeconds * 1000;
    document.querySelectorAll(".q-timer").forEach((el) => {
      const qi = Number(el.dataset.timer);
      const text = el.querySelector(".q-timer-text");
      const bar = el.querySelector(".q-timer-bar i");
      const interval = setInterval(() => {
        const left = Math.max(0, endAt - Date.now());
        text.textContent = `${Math.ceil(left / 1000)} dtk`;
        bar.style.width = `${(left / (questionSeconds * 1000)) * 100}%`;
        el.classList.toggle("urgent", left <= 5000);
        if (left === 0) {
          clearInterval(interval);
          timeoutQuestion(qi);
        }
      }, 200);
      questionTimers.push({ interval, qi });
    });
  }

  /* ---------------- SOAL: 2 SOAL SETIAP BERHENTI ----------------
     Bank soal berisi 50 kotak × 2 soal (questions.js).
     pickQuestionBox() mengambil kotak acak yang belum dipakai;
     setelah 50 kotak habis, daftar direset supaya bisa diulang. */
  function pickQuestionBox() {
    const boxes = window.QUESTION_BOXES || [];
    if (!boxes.length) return null;
    let pool = boxes.filter((b) => !usedBoxes.has(b.id));
    if (!pool.length) {
      usedBoxes.clear();
      pool = boxes.slice();
    }
    const box = pool[Math.floor(Math.random() * pool.length)];
    usedBoxes.add(box.id);
    return box;
  }

  function optionButton(q, qi, value, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "q-opt";
    btn.dataset.q = String(qi);
    btn.dataset.value = value;
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (quizAnswers[qi] === "__timeout__") return;
      quizAnswers[qi] = value;
      stopQuestionTimer(qi, "✓ Terjawab");
      btn.parentElement.querySelectorAll(".q-opt").forEach((b) => b.classList.toggle("selected", b === btn));
      $("quizSubmit").disabled = quizAnswers.some((a) => !a);
    });
    return btn;
  }

  function renderQuestion(q, qi, boxId) {
    const item = document.createElement("div");
    item.className = "q-item";
    const label = q.type === "picture" ? "Tebak Gambar" : q.type === "choice" ? "Pilihan Ganda" : "Sebutkan";
    item.innerHTML = `
      <div class="q-head">
        <span class="q-num">Soal ${qi + 1}</span>
        <span class="q-type">${label}</span>
      </div>`;

    const text = document.createElement("p");
    text.className = "q-text";
    text.textContent = q.display;
    item.appendChild(text);

    if (questionSeconds > 0) {
      const timer = document.createElement("div");
      timer.className = "q-timer";
      timer.dataset.timer = String(qi);
      timer.innerHTML = `<span>⏱️</span><span class="q-timer-text">${questionSeconds} dtk</span><span class="q-timer-bar"><i></i></span>`;
      item.appendChild(timer);
    }

    // GAMBAR TEBAK GAMBAR:
    // Utamakan file buatan Anda dari custom-sketches.js dengan kunci
    // "nomorKotak-nomorSoal", misal "2-2" = Kotak 2 Soal 2.
    // Kalau tidak ada, pakai sketsa SVG bawaan dari sketches.js.
    if (q.type === "picture") {
      const custom = (window.CUSTOM_SKETCHES || {})[`${boxId}-${qi + 1}`];
      if (custom) {
        const img = document.createElement("img");
        img.className = "q-sketch";
        img.src = custom;
        img.alt = `Sketsa: ${q.sketch}`;
        item.appendChild(img);
      } else if (window.getSketch) {
        const holder = document.createElement("div");
        holder.innerHTML = window.getSketch(q.sketch);
        if (holder.firstElementChild) item.appendChild(holder.firstElementChild);
      }
    }

    const opts = document.createElement("div");
    opts.className = "q-options";
    if (q.type === "choice") {
      q.options.forEach((o) => {
        const value = o.match(/^([A-C])\./)?.[1] || "";
        if (value) opts.appendChild(optionButton(q, qi, value, o));
      });
    } else {
      opts.appendChild(optionButton(q, qi, "Benar", "Benar"));
      opts.appendChild(optionButton(q, qi, "Salah", "Salah"));
      if (q.type === "say") {
        const note = document.createElement("p");
        note.className = "q-note";
        note.textContent = "👩‍🏫 Guru menilai jawaban siswa, lalu pilih Benar atau Salah.";
        item.appendChild(note);
        const ref = document.createElement("div");
        ref.className = "q-ref";
        ref.hidden = true;
        ref.textContent = `Acuan guru: ${q.answer || "Guru menilai langsung lewat penampilan siswa."}`;
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "text-btn";
        toggle.style.margin = "6px 0 0";
        toggle.textContent = "Lihat acuan guru";
        toggle.addEventListener("click", () => {
          ref.hidden = !ref.hidden;
          toggle.textContent = ref.hidden ? "Lihat acuan guru" : "Sembunyikan acuan";
        });
        item.append(toggle, ref);
      }
    }
    item.appendChild(opts);
    return item;
  }

  function askQuestions(player) {
    const box = pickQuestionBox();
    if (!box || box.questions.length < 2) {
      say("📝", "Bank soal belum tersedia. Lanjutkan permainan ya!");
      return Promise.resolve(2);       // anggap benar semua supaya tidak merugikan
    }
    clearQuestionTimers();
    currentQuizBox = box;
    quizAnswers = ["", ""];
    $("quizBoxNo").textContent = String(box.id);
    $("quizPlayer").textContent = `${player.emoji} ${player.name}`;
    $("quizList").innerHTML = "";
    $("quizFeedback").hidden = true;
    $("quizSubmit").disabled = true;
    box.questions.slice(0, 2).forEach((q, qi) => $("quizList").appendChild(renderQuestion(q, qi, box.id)));
    $("quizModal").hidden = false;
    $("quizSubmit").focus();
    startQuestionTimers();
    return new Promise((resolve) => { quizResolver = resolve; });
  }

  // Tombol KIRIM JAWABAN.
  // Penilaian: soal "say" dinilai guru lewat tombol Benar/Salah;
  // soal "choice"/"picture" dicek terhadap kunci di questions.js.
  // Timeout dianggap salah. Hasil dikirim sebagai JUMLAH benar (0/1/2),
  // lalu skor (+15 / +5 / -5) dihitung di fungsi rollDice() di bawah.
  $("quizSubmit").addEventListener("click", () => {
    if (!quizResolver || quizAnswers.some((a) => !a) || !currentQuizBox) return;
    clearQuestionTimers();
    let correctCount = 0;
    currentQuizBox.questions.slice(0, 2).forEach((q, qi) => {
      const chosen = quizAnswers[qi];
      const correct = q.type === "say" ? chosen === "Benar" : chosen === q.correct;
      if (correct) correctCount++;
      if (chosen !== "__timeout__") {
        $("quizList").querySelectorAll(`.q-opt[data-q="${qi}"]`).forEach((b) => {
          if (b.dataset.value === chosen) b.classList.add(correct ? "correct" : "wrong");
          if (q.type !== "say" && b.dataset.value === q.correct && !correct) b.classList.add("correct");
        });
      }
    });
    const feedback = $("quizFeedback");
    feedback.hidden = false;
    feedback.className = "quiz-feedback " + (correctCount === 2 ? "good" : correctCount === 1 ? "mid" : "bad");
    feedback.textContent = correctCount === 2
      ? "Hebat! Dua soal benar — kamu dapat +15 ⭐"
      : correctCount === 1
        ? "Lumayan! Satu soal benar — kamu dapat +5 ⭐"
        : "Belum tepat. Skor berkurang 5 ⭐. Coba lagi lain kalinya!";
    $("quizSubmit").disabled = true;
    tone(correctCount === 2 ? 880 : correctCount === 1 ? 600 : 220, .18);
    const resolve = quizResolver;
    quizResolver = null;
    setTimeout(() => {
      $("quizModal").hidden = true;
      resolve(correctCount);
    }, 1200);
  });

  /* ---------------- Dadu: angka besar + readout ---------------- */
  function setDieFace(face) {
    dieNumber.textContent = String(face);
    diceReadout.textContent = String(face);
    pips.forEach((pip, i) => pip.classList.toggle("on", PIPS[face].includes(i)));
    dieEl.setAttribute("aria-label", `Dadu, angka ${face}`);
  }

  async function rollDice() {
    if (rolling || finished) return;
    rolling = true;
    rollBtn.disabled = true;
    dieEl.classList.add("rolling");

    const player = players[current];
    say("🎲", `${player.emoji} ${player.name} melempar dadu...`);
    tone(520, .05, "triangle");

    for (let i = 0; i < 9; i++) {
      setDieFace(1 + Math.floor(Math.random() * 6));
      tone(360 + Math.random() * 260, .035, "square", .04);
      await sleep(65);
    }
    const value = 1 + Math.floor(Math.random() * 6);
    setDieFace(value);
    dieEl.classList.remove("rolling");
    tone(720, .12, "sine");
    // ATURAN DADU LEBIH JAUH DARI FINISH:
    // Jalan sampai kotak 100, lalu mundur sejumlah kelebihannya.
    // Contoh: posisi 98 + dadu 5 → 99, 100, 99, 98, 97 → berhenti di 97.
    let bounced = false;
    const sisa = LAST - player.pos;
    if (value > sisa) {
      const kelebihan = value - sisa;
      say("🎯", `${player.emoji} Dadu ${value}! Sisa ${sisa} kotak, kelebihan ${kelebihan} langkah.`);
      await sleep(350);
      await moveSteps(player, sisa);
      await sleep(200);
      say("↩️", `Sampai finish! Kelebihan ${kelebihan} langkah, ${player.name} mundur dari garis finish.`);
      tone(300, .12, "triangle");
      await moveSteps(player, kelebihan, -1);
      bounced = true;
    } else {
      say("🎯", `${player.emoji} Dadu menunjukkan ${value}! Jalan ${value} langkah, yuk!`);
      await sleep(350);
      await moveSteps(player, value);
    }

    const special = !bounced && (LADDERS[player.pos] || SNAKES[player.pos])
      ? { ladder: LADDERS[player.pos] || 0, snake: SNAKES[player.pos] || 0 }
      : null;
    const isFinish = player.pos === LAST;

    say("📝", `${player.emoji} Berhenti di kotak ${player.pos}. Ada 2 soal untukmu!`);
    await sleep(250);
    // SKOR PER BERHENTI (3 tingkat):
    //   2 soal benar → +15, 1 soal benar → +5, 0 soal benar → -5.
    // Timeout dihitung salah. Timer HANYA pembatas, tanpa bonus kecepatan.
    const correctCount = await askQuestions(player);
    const poin = correctCount === 2 ? 15 : correctCount === 1 ? 5 : -5;
    player.score += poin;
    updateTurn();
    const pesanSkor = correctCount === 2
      ? `Hebat! ${player.name} menjawab dua soal benar dan dapat +15 poin.`
      : correctCount === 1
        ? `Lumayan! ${player.name} menjawab satu soal benar dan dapat +5 poin.`
        : `Belum tepat, ${player.name} mendapat -5 poin. Semoga beruntung lagi!`;
    say(correctCount === 2 ? "⭐" : correctCount === 1 ? "👍" : "💪", pesanSkor);
    await sleep(550);

    // Tangga/ular tetap memakai syarat lama: harus dua soal benar.
    if (special) await resolveSpecial(player, special, correctCount === 2);

    // BONUS FINISH +100 (berlaku sekali saat sampai kotak 100).
    if (isFinish) {
      player.score += 100;
      updateTurn();
      say("🎁", `Bonus finish +100 poin! Total skor ${player.name}: ${player.score} ⭐`);
      await sleep(650);
      endGame(player);
      return;
    }

    current = (current + 1) % players.length;
    updateTurn();
    say("👉", `Giliran ${players[current].emoji} ${players[current].name}. Semoga beruntung!`);
    rolling = false;
    rollBtn.disabled = false;
  }

  async function moveSteps(player, steps, arah = 1) {
    for (let i = 0; i < steps; i++) {
      player.pos = Math.max(1, Math.min(LAST, player.pos + arah));
      positionPawn(player);
      updateTurn();
      tone(300 + player.pos * 3, .05, "sine", .05);
      await sleep(190);
    }
  }

  // TANGGA & Ular baru berlaku setelah soal dijawab:
  //   tangga → naik HANYA kalau dua soal benar, kalau salah tetap di kotak
  //   ular   → turun HANYA kalau ada yang salah, kalau benar aman tidak turun
  async function resolveSpecial(player, special, allCorrect) {
    if (special.ladder) {
      if (!allCorrect) {
        say("🪜", `Kotak tangga! Sayang, jawaban belum benar, jadi ${player.name} tetap di kotak ${player.pos}.`);
        tone(220, .16, "triangle");
        await sleep(750);
        return;
      }
      say("🪜", `Benar! Tangga boleh dipakai — naik ke kotak ${special.ladder}! 🎉`);
      tone(520, .1); await sleep(100); tone(660, .1); await sleep(100); tone(880, .18);
      player.pos = special.ladder;
      positionPawn(player); updateTurn();
      await sleep(600);
    } else if (special.snake) {
      if (allCorrect) {
        say("🐍", `Benar! ${player.name} aman dan tidak turun ke ekor ular.`);
        tone(660, .16);
        await sleep(750);
        return;
      }
      say("🐍", `Belum beruntung! ${player.name} meluncur ke kotak ${special.snake}...`);
      tone(240, .22, "sawtooth", .08);
      player.pos = special.snake;
      positionPawn(player); updateTurn();
      await sleep(600);
    }
  }

  function endGame(winner) {
    finished = true;
    // Auto-stop rekaman tepat saat permainan selesai, lalu file ter-download.
    if (recording) stopRecording();
    rolling = false;
    rollBtn.disabled = true;
    updateTurn();
    say("🏆", `${winner.emoji} ${winner.name} sampai di garis finish! Hebat!`);
    $("winText").textContent = `${winner.emoji} ${winner.name} menang! Skor akhir ⭐ ${winner.score} (termasuk bonus finish +100) 🎉`;
    winModal.hidden = false;
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .22, "triangle", .07), i * 130));
    makeConfetti();
    $("playAgainBtn").focus();
  }

  /* ---------------- MUSIK LATAR + VOLUME ----------------
     Sumber: assets/Bg-Music.mp4.
     Browser melarang autoplay sebelum ada interaksi. Jadi:
       1. saat halaman dibuka → dicoba diputar dahulu
       2. kalau ditolak → langsung bunyi saat klik pertama di mana saja
          (termasuk klik di menu awal, bukan harus tombol PLAY)
     Tombol ▶/⏸ = putar/jeda. Slider 0-100 = kerasnya suara.
     Tombol 🔊 di header = mute semua suara (efek + musik). */
  function updateMusicUI() {
    const playing = musicWanted && !bgMusic.paused && !bgMusic.ended;
    // Pakai simbol teks ▶ / ⏸ (bukan emoji 🎵) supaya ikon tidak miring.
    musicToggle.textContent = playing ? "⏸" : "▶";
    musicToggle.setAttribute("aria-label", playing ? "Jeda musik" : "Putar musik");
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicValue.textContent = `${volumeLevel}%`;
    musicVolume.value = String(volumeLevel);
    // Petunjuk hanya tampil saat autoplay ditolak dan musik memang diinginkan.
    musicHint.hidden = !(waitingGesture && musicWanted && !playing);
  }

  // Kalau autoplay ditolak, tunggu satu klik/sentuhan pertama dari pengguna.
  function waitForFirstGesture() {
    if (waitingGesture) return;
    waitingGesture = true;
    const events = ["pointerdown", "click", "touchstart", "keydown"];
    const go = () => {
      events.forEach((ev) => document.removeEventListener(ev, go));
      waitingGesture = false;
      updateMusicUI();
      if (musicWanted && !muted) startBgMusic();
    };
    events.forEach((ev) => document.addEventListener(ev, go, { passive: true }));
  }

  function startBgMusic() {
    if (!musicWanted) return;
    bgMusic.volume = volumeLevel / 100;   // 0 = diam, 1 = paling keras
    bgMusic.muted = muted;
    if (!bgMusic.paused) return;          // sudah berputar, jangan diputar ulang
    const main = bgMusic.play();
    if (main && typeof main.catch === "function") {
      main.catch(() => waitForFirstGesture()); // autoplay ditolak browser
    }
    updateMusicUI();
  }

  function pauseMusic() {
    bgMusic.pause();
    updateMusicUI();
  }

  // Satu tempat untuk mengatur mute, dipakai tombol 🔊 dan tombol ▶/⏸.
  function setMuted(value) {
    muted = value;
    soundBtn.textContent = muted ? "🔇" : "🔊";
    soundBtn.setAttribute("aria-label", muted ? "Nyalakan suara" : "Matikan suara");
    bgMusic.muted = muted;
    if (!muted) startBgMusic();
  }

  // Suara sederhana memakai Web Audio (tanpa file mp3).
  // Tombol 🔊 di header menyetel variabel muted.
  function tone(freq, duration = .1, type = "sine", volume = .09) {
    if (muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration + .02);
    } catch (_) { /* audio tidak tersedia */ }
  }

  function makeConfetti() {
    clearConfetti();
    const colors = ["#1D7302", "#57A32A", "#C58153", "#F2B45A", "#D96C5F"];
    for (let i = 0; i < 70; i++) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.animationDuration = `${1.8 + Math.random() * 1.8}s`;
      bit.style.animationDelay = `${Math.random() * .5}s`;
      bit.style.opacity = String(.6 + Math.random() * .4);
      confettiEl.appendChild(bit);
    }
  }
  function clearConfetti() { confettiEl.innerHTML = ""; }

  /* ---------------- REKAM GAMEPLAY ----------------
     Memakai Screen Capture API + MediaRecorder (Chrome/Edge modern).
     Alur: klik ⏺️ → pengguna pilih tab ini → rekaman jalan →
     otomatis berhenti saat pemenang muncul → file ter-download.

     CATATAN PENTING:
       • Browser TIDAK mengizinkan rekam otomatis tanpa izin. Harus ada klik.
       • Pilih TAB ini dan centang "Bagikan audio tab" supaya musik + efek
         suara game ikut terekam (mic tidak pernah dipakai).
       • Format: WebM VP9 diprioritaskan karena paling stabil untuk rekam tab.
          MP4 (H.264) kadang menghasilkan blok hijau di bagian bawah video.
          Kalau ingin memaksa MP4 lagi, tukar urutan di pickRecordingMime().
        • Jangan mengubah ukuran jendela / scroll saat merekam. */
  function pickRecordingMime(hasAudio) {
    const withAudio = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=avc1,mp4a.40.2",
      "video/mp4",
    ];
    const videoOnly = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=avc1",
      "video/mp4",
    ];
    const list = hasAudio ? withAudio : videoOnly;
    return list.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }

  function updateRecordUI() {
    recordBtn.textContent = recording ? "⏹️" : "⏺️";
    recordBtn.classList.toggle("recording", recording);
    recordBtn.setAttribute("aria-label", recording ? "Hentikan rekaman" : "Mulai rekam gameplay");
    recordBtn.title = recording ? "Hentikan & simpan rekaman" : "Rekam gameplay";
  }

  function downloadRecording(blob, mime) {
    const ext = mime.indexOf("mp4") !== -1 ? "mp4" : "webm";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gameplay-ular-tangga-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function releaseRecordStream() {
    if (!recordStream) return;
    recordStream.getTracks().forEach((track) => track.stop());
    recordStream = null;
  }

  async function startRecording() {
    if (recording) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia || !window.MediaRecorder) {
      say("⚠️", "Browser ini belum mendukung rekaman layar. Pakai Chrome terbaru, ya!");
      tone(220, .15, "triangle");
      return;
    }
    try {
      // displaySurface: "browser" mengarahkan pengguna untuk memilih TAB,
      // jadi audio yang masuk adalah audio game, bukan mic/system.
      const support = navigator.mediaDevices.getSupportedConstraints?.() || {};
      // Frame rate dipatok 30 fps supaya encoder tidak bingung (blok hijau).
      const fps = { ideal: 30, max: 30 };
      const video = support.displaySurface
        ? { frameRate: fps, displaySurface: "browser" }
        : { frameRate: fps };
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video, audio: true, preferCurrentTab: true,
      });
      recordStream = stream;

      const hasAudio = stream.getAudioTracks().length > 0;
      const mime = pickRecordingMime(hasAudio);
      // Bitrate dinaikkan: latar Bg.png + animasi butuh lebih banyak data.
      const options = { videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 128_000 };
      if (mime) options.mimeType = mime;
      recorder = new MediaRecorder(stream, options);
      recordChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordChunks.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mime || "video/webm";
        const blob = new Blob(recordChunks, { type });
        if (blob.size > 0) downloadRecording(blob, type);
        releaseRecordStream();
        recorder = null;
        recordChunks = [];
        recording = false;
        updateRecordUI();
        if (!finished) say("💾", `Rekaman tersimpan (${type.indexOf("mp4") !== -1 ? "MP4" : "WebM"}).`);
      };

      // Kalau pengguna menekan "Stop sharing" di browser, hentikan juga.
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.addEventListener("ended", () => { if (recording) stopRecording(); }, { once: true });

      recorder.start(1000);   // simpan potongan tiap 1 detik
      recording = true;
      updateRecordUI();
      say("🔴", "Sedang merekam gameplay. Rekaman berhenti otomatis saat game selesai.");
      tone(660, .08);
    } catch (err) {
      // Pengguna membatalkan dialog izin → tidak apa-apa, game tetap jalan.
      releaseRecordStream();
      recorder = null;
      recording = false;
      updateRecordUI();
      say("🙂", "Rekaman dibatalkan. Game tetap bisa dilanjutkan.");
    }
  }

  function stopRecording() {
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else {
      releaseRecordStream();
      recording = false;
      updateRecordUI();
    }
  }

  /* ---------------- Event ---------------- */
  // Klik PLAY tetap mencoba menyalakan musik (selain percobaan saat load).
  $("playBtn").addEventListener("click", () => { startBgMusic(); showScreen("countScreen"); });
  $("menuBtn").addEventListener("click", () => { if (recording) stopRecording(); showScreen("menuScreen"); });
  $("playAgainBtn").addEventListener("click", () => { winModal.hidden = true; setupGame(); });
  $("backToMenuBtn").addEventListener("click", () => { winModal.hidden = true; if (recording) stopRecording(); showScreen("menuScreen"); });
  rollBtn.addEventListener("click", rollDice);

  // Tombol 🔊 di header: mute semua suara (efek + musik).
  soundBtn.addEventListener("click", () => {
    setMuted(!muted);
    if (!muted) tone(660, .08);
  });

  // Tombol rekam: sekali klik mulai, klik lagi hentikan & download.
  recordBtn.addEventListener("click", () => { if (recording) stopRecording(); else startRecording(); });

  // Tombol 🎵: putar / jeda musik. Saat menyalakan, mute dilepas dulu.
  musicToggle.addEventListener("click", () => {
    musicWanted = !musicWanted;
    if (musicWanted) {
      if (muted) setMuted(false);
      startBgMusic();
    } else {
      pauseMusic();
    }
    updateMusicUI();
  });

  // Slider volume: 0 = diam, 100 = paling keras. Langsung terdengar.
  musicVolume.addEventListener("input", () => {
    volumeLevel = Number(musicVolume.value);
    bgMusic.volume = volumeLevel / 100;
    musicValue.textContent = `${volumeLevel}%`;
    if (volumeLevel > 0 && musicWanted && !muted) startBgMusic();
    updateMusicUI();
  });

  // Jaga tampilan tombol tetap benar kalau audio berhenti/diputar dari mana saja.
  bgMusic.addEventListener("play", updateMusicUI);
  bgMusic.addEventListener("pause", updateMusicUI);
  document.addEventListener("keydown", (e) => {
    if (!winModal.hidden && e.key === "Escape") winModal.hidden = true;
  });
  window.addEventListener("resize", drawLinks);
  if (window.ResizeObserver) new ResizeObserver(drawLinks).observe(board);
  window.addEventListener("load", drawLinks);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawLinks);

  // --- Init ---
  bgMusic.volume = volumeLevel / 100;
  bgMusic.muted = muted;
  updateMusicUI();
  startBgMusic();   // coba autoplay; kalau ditolak, tunggu klik pertama
  insertCells();
  setDieFace(1);
})();
