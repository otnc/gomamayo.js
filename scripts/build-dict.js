// SudachiDict (Apache-2.0) の生の語彙表から、固有名詞の読み表 dict/readings.tsv.gz を生成する。
//
// Usage: node scripts/build-dict.js [sudachiDictVersion]
//   e.g. node scripts/build-dict.js 20260428
//
// 収録基準:
//   - 品詞が 名詞,固有名詞 で、読み(カタカナ)を持つエントリ
//   - 表記をカタカナ化しただけで読みになるもの(カタカナ語など)は、
//     kuromoji の未知語処理で読めるため除外してサイズを削減する

import fs from "fs";
import path from "path";
import os from "os";
import url from "node:url";
import zlib from "zlib";
import readline from "readline";
import AdmZip from "adm-zip";
import consola from "consola";
import wanakana from "wanakana";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DEFAULT_VERSION = "20260428";

// core を優先し、full 限定語彙 (notcore)、small の順で採録する
const LEX_FILES = ["core_lex", "notcore_lex", "small_lex"];

async function resolveVersion() {
  const requested =
    process.argv[2] || process.env.SUDACHIDICT_VERSION || DEFAULT_VERSION;
  if (requested !== "latest") return requested;

  const res = await fetch(
    "https://api.github.com/repos/WorksApplications/SudachiDict/releases/latest",
  );
  if (!res.ok) {
    throw new Error(`Failed to resolve latest SudachiDict: ${res.status}`);
  }
  const tag = (await res.json()).tag_name; // 例: "v20260428"
  return tag.replace(/^v/, "");
}

const MAX_SURFACE_LENGTH = 64;
const KATAKANA_READING = /^[ァ-ヶー]+$/;

// 注: src/kana.ts の normalize() / hiraToKata() と同一に保つこと
function normalize(str) {
  return str.normalize("NFKC").replace(/\s+/g, "");
}

function hiraToKata(str) {
  return wanakana.toKatakana(str, { passRomaji: true });
}

async function download(fileUrl, dest) {
  if (fs.existsSync(dest)) {
    consola.info(`cached: ${path.basename(dest)}`);
    return;
  }
  consola.start(`downloading ${fileUrl}`);
  const res = await fetch(fileUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${fileUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  consola.success(`downloaded ${path.basename(dest)} (${buf.length} bytes)`);
}

async function collect(csvPath, entries) {
  const reader = readline.createInterface({
    input: fs.createReadStream(csvPath, "utf8"),
    crlfDelay: Infinity,
  });
  let added = 0;
  for await (const line of reader) {
    // 注: カンマを含む表記("..."で引用される)はフィールドがずれるが、
    // 品詞判定に落ちてスキップされるだけなので単純な split で足りる
    const f = line.split(",");
    if (f.length < 12) continue;
    if (f[5] !== "名詞" || f[6] !== "固有名詞") continue;

    const reading = f[11];
    if (!KATAKANA_READING.test(reading)) continue;

    const surface = normalize(f[0]);
    if (surface.length < 2 || surface.length > MAX_SURFACE_LENGTH) continue;
    if (/[\t\n\r]/.test(surface)) continue;
    // 表記のカタカナ化 == 読み なら kuromoji の未知語処理で読めるので不要
    if (hiraToKata(surface) === reading) continue;

    if (!entries.has(surface)) {
      entries.set(surface, reading);
      added++;
    }
  }
  return added;
}

(async () => {
  const version = await resolveVersion();
  const baseUrl = `https://sudachi.s3-ap-northeast-1.amazonaws.com/sudachidict-raw/${version}`;
  consola.info(`SudachiDict raw lexicon version: ${version}`);

  const cacheDir = path.join(os.tmpdir(), `sudachidict-raw-${version}`);
  fs.mkdirSync(cacheDir, { recursive: true });

  const entries = new Map();
  for (const name of LEX_FILES) {
    const zipPath = path.join(cacheDir, `${name}.zip`);
    const csvPath = path.join(cacheDir, `${name}.csv`);
    await download(`${baseUrl}/${name}.zip`, zipPath);
    if (!fs.existsSync(csvPath)) {
      consola.start(`extracting ${name}.zip`);
      new AdmZip(zipPath).extractAllTo(cacheDir, true);
    }
    const added = await collect(csvPath, entries);
    consola.success(`${name}: +${added} entries (total ${entries.size})`);
  }

  consola.start("sorting & writing");
  // 実行時の二分探索と一致するよう UTF-8 バイト順でソートする
  const rows = [...entries].map(([surface, reading]) => ({
    key: Buffer.from(surface, "utf8"),
    line: Buffer.from(`${surface}\t${reading}\n`, "utf8"),
  }));
  rows.sort((a, b) => Buffer.compare(a.key, b.key));

  const tsv = Buffer.concat(rows.map((r) => r.line));
  const gz = zlib.gzipSync(tsv, { level: 9 });

  const outDir = path.join(rootDir, "dict");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "readings.tsv.gz");
  fs.writeFileSync(outPath, gz);
  fs.writeFileSync(
    path.join(outDir, "VERSION"),
    `SudachiDict raw lexicon ${version}\n`,
  );

  consola.success(
    `wrote ${outPath}: ${entries.size} entries, ` +
      `${(tsv.length / 1024 / 1024).toFixed(1)} MB raw / ` +
      `${(gz.length / 1024 / 1024).toFixed(1)} MB gzipped`,
  );
})();
