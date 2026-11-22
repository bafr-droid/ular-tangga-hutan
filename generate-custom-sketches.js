/* ============================================================
   Cocokkan file gambar di assets/sketches/ dengan soal tebak gambar.
   Jalankan: node generate-custom-sketches.js

   Nama file boleh diakhiri spasi / spasi ganda — tetap dikenali.
   Kunci yang dibuat: "nomorKotak-nomorSoal", misal "2-2".
   ============================================================ */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const sketchDir = path.join(root, "assets", "sketches");

global.window = {};
require(path.join(root, "questions.js"));
const boxes = global.window.QUESTION_BOXES;

const files = fs.readdirSync(sketchDir).filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f) && f !== "contoh-sketsa.svg");
const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();
const byName = new Map(files.map((f) => [norm(path.basename(f, path.extname(f))), f]));

const entries = [];
const missing = [];

for (const box of boxes) {
  box.questions.forEach((q, qi) => {
    if (q.type !== "picture") return;
    const file = byName.get(norm(q.sketch));
    if (!file) {
      missing.push(`Kotak ${box.id} Soal ${qi + 1}: ${q.sketch}`);
      return;
    }
    entries.push({ key: `${box.id}-${qi + 1}`, file, desc: q.sketch });
  });
}

const header = `/* AUTO-GENERATED oleh generate-custom-sketches.js — jangan edit manual.
   Regenerate: node generate-custom-sketches.js
   Kunci = "nomorKotak-nomorSoal"  (contoh "2-2" = Kotak 2 Soal 2) */
window.CUSTOM_SKETCHES = {
${entries.map((e) => `  ${JSON.stringify(e.key)}: "assets/sketches/${e.file}", // ${e.desc}`).join("\n")}
};
`;

fs.writeFileSync(path.join(sketchDir, "custom-sketches.js"), header, "utf8");
console.log(`custom-sketches.js dibuat: ${entries.length} gambar terdaftar.`);
if (missing.length) {
  console.log("Belum cocok (memakai sketsa bawaan):");
  missing.forEach((m) => console.log("  - " + m));
}
