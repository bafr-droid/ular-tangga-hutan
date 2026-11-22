/* ============================================================
   Parser Bank-Soal.txt -> questions.js
   Jalankan: node generate-questions.js
   ============================================================ */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "assets", "Bank-Soal.txt");
const out = path.join(__dirname, "questions.js");
const raw = fs.readFileSync(src, "utf8").replace(/\r\n?/g, "\n");

const headerRe = /^\s*(?:###\s*)?\*{0,2}KOTAK\s+(\d+)\*{0,2}\s*$/gm;
const headers = [...raw.matchAll(headerRe)];

function clean(text) {
  return text.replace(/\*\*/g, "").replace(/\\([.\\])/g, "$1").replace(/\s+/g, " ").trim();
}

function parseAnswer(lines) {
  return lines
    .map((line) =>
      line
        .replace(/^\*\*Jawaban:?\*\*\s*:?\s*/i, "")
        .replace(/^\*\*Jawaban\s*:\s*/i, "")
        .replace(/\*\*$/, "")
        .trim()
    )
    .filter(Boolean)
    .join(" ");
}

function parseQuestion(chunk) {
  const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
  const first = lines.shift() || "";
  const options = [];
  const answerLines = [];

  for (const line of lines) {
    if (/^[-*]\s+/.test(line)) options.push(clean(line.replace(/^[-*]\s+/, "")));
    else if (/^(\*{0,2}Jawaban\*{0,2}\s*:|\*{2}Jawaban:?\*{2})/i.test(line)) answerLines.push(line);
  }

  const answer = parseAnswer(answerLines);
  const text = clean(first);
  const isPicture = /tebak gambar/i.test(text);
  const isChoice = options.some((o) => /^[A-C]\./.test(o));
  const type = isPicture ? "picture" : isChoice ? "choice" : "say";

  const q = { type, text, options, answer };

  if (isPicture) {
    const m = /Tampilkan gambar\s+(.+?)\.\s*Pernyataan:\s*(.+)$/i.exec(text);
    q.sketch = m ? clean(m[1]) : "";
    q.statement = m ? clean(m[2]) : text;
    q.display = q.statement;
  } else {
    q.display = text.replace(/^Challenge:\s*/i, "Tantangan: ");
  }

  if (type === "choice") {
    q.correct = answer.match(/^([A-C])\./)?.[1] || "";
  } else if (type === "picture") {
    q.correct = /^benar/i.test(answer) ? "Benar" : /^salah/i.test(answer) ? "Salah" : "";
  }

  return q;
}

const boxes = [];
for (let i = 0; i < headers.length; i++) {
  const id = Number(headers[i][1]);
  const start = headers[i].index + headers[i][0].length;
  const end = i + 1 < headers.length ? headers[i + 1].index : raw.length;
  const block = raw.slice(start, end);
  const chunks = block.split(/^\s*[12]\\\.\s+/m).slice(1);
  const questions = chunks.map(parseQuestion).filter((q) => q.text || q.display);
  boxes.push({ id, questions });
}

const banner = "/* AUTO-GENERATED dari assets/Bank-Soal.txt — jangan edit manual.\n   Regenerate: node generate-questions.js */\n";
fs.writeFileSync(out, banner + "window.QUESTION_BOXES = " + JSON.stringify(boxes, null, 2) + ";\n", "utf8");

const types = boxes.flatMap((b) => b.questions).reduce((acc, q) => {
  acc[q.type] = (acc[q.type] || 0) + 1;
  return acc;
}, {});
console.log(`questions.js dibuat: ${boxes.length} kotak, ${boxes.flatMap((b) => b.questions).length} soal`, types);
