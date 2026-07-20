"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  analyze: () => analyze,
  clearTokenizerCache: () => clearTokenizerCache,
  default: () => src_default,
  find: () => find,
  isGomamayo: () => isGomamayo
});
module.exports = __toCommonJS(src_exports);

// node_modules/tsup/assets/cjs_shims.js
var getImportMetaUrl = () => typeof document === "undefined" ? new URL(`file:${__filename}`).href : document.currentScript && document.currentScript.tagName.toUpperCase() === "SCRIPT" ? document.currentScript.src : new URL("main.js", document.baseURI).href;
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();

// src/index.ts
var import_kuromoji = __toESM(require("kuromoji"), 1);
var import_node_path = __toESM(require("path"), 1);
var import_node_fs2 = __toESM(require("fs"), 1);
var import_node_url = require("url");
var import_node_module = require("module");

// src/reading-dict.ts
var import_node_fs = __toESM(require("fs"), 1);
var import_node_zlib = __toESM(require("zlib"), 1);
var TAB = 9;
var NL = 10;
var ReadingDict = class _ReadingDict {
  buf;
  offsets;
  /** 最長表記のUTF-8バイト長。コードユニット長の上限としても使える */
  maxSurfaceLength;
  size;
  constructor(tsv) {
    this.buf = tsv;
    let lines = 0;
    for (let i = 0; i < tsv.length; i++) {
      if (tsv[i] === NL) lines++;
    }
    const offsets = new Uint32Array(lines);
    let maxKey = 0;
    let lineStart = 0;
    let line = 0;
    let tabPos = -1;
    for (let i = 0; i < tsv.length; i++) {
      const b = tsv[i];
      if (b === TAB && tabPos < 0) {
        tabPos = i;
      } else if (b === NL) {
        offsets[line++] = lineStart;
        if (tabPos >= 0 && tabPos - lineStart > maxKey) {
          maxKey = tabPos - lineStart;
        }
        lineStart = i + 1;
        tabPos = -1;
      }
    }
    this.offsets = offsets;
    this.size = lines;
    this.maxSurfaceLength = maxKey;
  }
  static loadSync(filePath) {
    return new _ReadingDict(import_node_zlib.default.gunzipSync(import_node_fs.default.readFileSync(filePath)));
  }
  /** 表記と完全一致するエントリの読み(カタカナ)を返す */
  lookup(surface) {
    const key = Buffer.from(surface, "utf8");
    let lo = 0;
    let hi = this.size - 1;
    while (lo <= hi) {
      const mid = lo + hi >>> 1;
      const cmp = this.compareAt(this.offsets[mid], key);
      if (cmp === 0) {
        return this.readingAt(this.offsets[mid]);
      } else if (cmp < 0) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return null;
  }
  /** 行の表記部分とkeyをバイト比較する (エントリ < key: 負, 一致: 0, エントリ > key: 正) */
  compareAt(offset, key) {
    for (let i = 0; ; i++) {
      const b = this.buf[offset + i];
      const entryEnded = b === TAB || b === void 0;
      if (i >= key.length) return entryEnded ? 0 : 1;
      if (entryEnded) return -1;
      if (b !== key[i]) return b < key[i] ? -1 : 1;
    }
  }
  readingAt(offset) {
    let tab = offset;
    while (this.buf[tab] !== TAB) tab++;
    let end = tab + 1;
    while (end < this.buf.length && this.buf[end] !== NL) end++;
    return this.buf.toString("utf8", tab + 1, end);
  }
};

// src/index.ts
var requireFn = (0, import_node_module.createRequire)(importMetaUrl);
var packageRoot = import_node_path.default.resolve(
  import_node_path.default.dirname((0, import_node_url.fileURLToPath)(importMetaUrl)),
  ".."
);
var getIpadicDictPath = () => {
  try {
    const pkgJson = requireFn.resolve("kuromoji/package.json");
    const dictPath = import_node_path.default.join(import_node_path.default.dirname(pkgJson), "dict");
    if (import_node_fs2.default.existsSync(dictPath)) {
      return dictPath;
    }
  } catch {
  }
  return import_node_path.default.join(packageRoot, "node_modules", "kuromoji", "dict");
};
var getReadingDictPath = () => import_node_path.default.join(packageRoot, "dict", "readings.tsv.gz");
var VOWEL_MAP = {
  \u30A2: "\u30A2",
  \u30A4: "\u30A4",
  \u30A6: "\u30A6",
  \u30A8: "\u30A8",
  \u30AA: "\u30AA",
  \u30AB: "\u30A2",
  \u30AD: "\u30A4",
  \u30AF: "\u30A6",
  \u30B1: "\u30A8",
  \u30B3: "\u30AA",
  \u30B5: "\u30A2",
  \u30B7: "\u30A4",
  \u30B9: "\u30A6",
  \u30BB: "\u30A8",
  \u30BD: "\u30AA",
  \u30BF: "\u30A2",
  \u30C1: "\u30A4",
  \u30C4: "\u30A6",
  \u30C6: "\u30A8",
  \u30C8: "\u30AA",
  \u30CA: "\u30A2",
  \u30CB: "\u30A4",
  \u30CC: "\u30A6",
  \u30CD: "\u30A8",
  \u30CE: "\u30AA",
  \u30CF: "\u30A2",
  \u30D2: "\u30A4",
  \u30D5: "\u30A6",
  \u30D8: "\u30A8",
  \u30DB: "\u30AA",
  \u30DE: "\u30A2",
  \u30DF: "\u30A4",
  \u30E0: "\u30A6",
  \u30E1: "\u30A8",
  \u30E2: "\u30AA",
  \u30E4: "\u30A2",
  \u30E6: "\u30A6",
  \u30E8: "\u30AA",
  \u30E9: "\u30A2",
  \u30EA: "\u30A4",
  \u30EB: "\u30A6",
  \u30EC: "\u30A8",
  \u30ED: "\u30AA",
  \u30EF: "\u30A2",
  \u30F2: "\u30AA",
  \u30F3: "\u30F3",
  \u30AC: "\u30A2",
  \u30AE: "\u30A4",
  \u30B0: "\u30A6",
  \u30B2: "\u30A8",
  \u30B4: "\u30AA",
  \u30B6: "\u30A2",
  \u30B8: "\u30A4",
  \u30BA: "\u30A6",
  \u30BC: "\u30A8",
  \u30BE: "\u30AA",
  \u30C0: "\u30A2",
  \u30C2: "\u30A4",
  \u30C5: "\u30A6",
  \u30C7: "\u30A8",
  \u30C9: "\u30AA",
  \u30D0: "\u30A2",
  \u30D3: "\u30A4",
  \u30D6: "\u30A6",
  \u30D9: "\u30A8",
  \u30DC: "\u30AA",
  \u30D1: "\u30A2",
  \u30D4: "\u30A4",
  \u30D7: "\u30A6",
  \u30DA: "\u30A8",
  \u30DD: "\u30AA",
  \u30A1: "\u30A2",
  \u30A3: "\u30A4",
  \u30A5: "\u30A6",
  \u30A7: "\u30A8",
  \u30A9: "\u30AA",
  \u30E3: "\u30A2",
  \u30E5: "\u30A6",
  \u30E7: "\u30AA",
  \u30C3: "\u30C3",
  \u30F4: "\u30A6"
};
var MORA_PATTERN = /[ウクスツヌフムユルグズヅブプヴ][ァィェォ]|[イキシチニヒミリギジヂビピ][ャュェョ]|[テデ][ィュ]|[ァ-ヴー]/g;
function divideMora(str) {
  return str.match(MORA_PATTERN) ?? [];
}
function hiraToKata(str) {
  return str.replace(
    /[ぁ-ゖ]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) + 96)
  );
}
function prolongedToVowel(str) {
  const moras = divideMora(str);
  if (moras.length === 0) return str;
  const first = moras[0];
  if (!first) return str;
  const result = [first];
  for (let i = 1; i < moras.length; i++) {
    const current = moras[i];
    if (!current) continue;
    if (current === "\u30FC") {
      const prevMora = moras[i - 1];
      if (prevMora) {
        const lastChar = prevMora[prevMora.length - 1];
        result.push(lastChar ? VOWEL_MAP[lastChar] ?? lastChar : current);
      } else {
        result.push(current);
      }
    } else {
      result.push(current);
    }
  }
  return result.join("");
}
function getReading(token) {
  const reading = token.reading ?? token.surface_form;
  return hiraToKata(reading);
}
function normalize(str) {
  return str.normalize("NFKC").replace(/\s+/g, "").replace(
    /[Ａ-Ｚａ-ｚ０-９]/g,
    (c) => String.fromCharCode(c.charCodeAt(0) - 65248)
  );
}
var ipadicTokenizer = null;
var readingDict = null;
function getIpadicTokenizer() {
  if (!ipadicTokenizer) {
    ipadicTokenizer = new Promise((resolve, reject) => {
      import_kuromoji.default.builder({ dicPath: getIpadicDictPath() }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return ipadicTokenizer;
}
function getReadingDict() {
  if (!readingDict) {
    readingDict = ReadingDict.loadSync(getReadingDictPath());
  }
  return readingDict;
}
function clearTokenizerCache(type = "all") {
  if (type === "ipadic" || type === "all") {
    ipadicTokenizer = null;
  }
  if (type === "dict" || type === "neologd" || type === "all") {
    readingDict = null;
  }
  const g = globalThis;
  if (g.gc) {
    g.gc();
  }
}
function findMaxDegree(formerMora, laterMora) {
  const maxCheck = Math.min(formerMora.length, laterMora.length);
  let maxDegree = 0;
  for (let deg = 1; deg <= maxCheck; deg++) {
    let match = true;
    for (let i = 0; i < deg; i++) {
      if (formerMora[formerMora.length - deg + i] !== laterMora[i]) {
        match = false;
        break;
      }
    }
    if (match) maxDegree = deg;
  }
  return maxDegree;
}
function findInternalGomamayo(moras, higher) {
  const results = [];
  const maxDegree = higher ? Math.floor(moras.length / 2) : 1;
  for (let pos = 1; pos < moras.length; pos++) {
    for (let deg = 1; deg <= Math.min(maxDegree, pos, moras.length - pos); deg++) {
      let match = true;
      for (let i = 0; i < deg; i++) {
        if (moras[pos - deg + i] !== moras[pos + i]) {
          match = false;
          break;
        }
      }
      if (match) {
        const existing = results.find((r) => r.position === pos);
        if (existing) {
          existing.degree = Math.max(existing.degree, deg);
        } else {
          results.push({ degree: deg, position: pos });
        }
      }
    }
  }
  return results;
}
function applyReadingDict(tokens, text, dict) {
  const starts = [];
  let acc = 0;
  for (const token of tokens) {
    starts.push(acc);
    acc += token.surface_form.length;
  }
  const infos = [];
  let i = 0;
  while (i < tokens.length) {
    const start = starts[i];
    let j = i;
    while (j + 1 < tokens.length && starts[j + 1] + tokens[j + 1].surface_form.length - start <= dict.maxSurfaceLength) {
      j++;
    }
    let merged = false;
    for (; j > i; j--) {
      const end = starts[j] + tokens[j].surface_form.length;
      const surface = text.slice(start, end);
      const reading2 = dict.lookup(surface);
      if (reading2) {
        infos.push({ surface, reading: reading2, merged: true });
        i = j + 1;
        merged = true;
        break;
      }
    }
    if (merged) continue;
    const token = tokens[i];
    let reading = token.reading;
    if (!reading) {
      reading = dict.lookup(token.surface_form) ?? token.surface_form;
    }
    infos.push({
      surface: token.surface_form,
      reading: hiraToKata(reading),
      merged: false
    });
    i++;
  }
  return infos;
}
async function analyze(input, options = {}) {
  const { higher = true, multi = true } = options;
  const useDict = options.useDict ?? options.useNeologd ?? true;
  const tokenizer = await getIpadicTokenizer();
  const dict = useDict ? getReadingDict() : null;
  const normalized = normalize(input);
  const tokens = tokenizer.tokenize(normalized);
  const tokenInfos = dict ? applyReadingDict(tokens, normalized, dict) : tokens.map((token) => ({
    surface: token.surface_form,
    reading: getReading(token),
    merged: false
  }));
  const result = {
    isGomamayo: false,
    matches: [],
    degree: 0,
    ary: 0,
    input,
    reading: tokenInfos.map((t) => t.reading).join("")
  };
  for (let i = 0; i < tokenInfos.length - 1; i++) {
    const former = tokenInfos[i];
    const later = tokenInfos[i + 1];
    if (!former || !later) continue;
    const formerReading = prolongedToVowel(former.reading);
    const laterReading = later.reading;
    const formerMora = divideMora(formerReading);
    const laterMora = divideMora(laterReading);
    if (formerMora.length === 0 || laterMora.length === 0) continue;
    const deg = findMaxDegree(formerMora, laterMora);
    if (deg > 0 && (higher || deg === 1)) {
      result.matches.push({
        words: [former.surface, later.surface],
        readings: [former.reading, later.reading],
        degree: deg,
        position: i
      });
      result.degree = Math.max(result.degree, deg);
      result.ary++;
      if (!multi) break;
    }
  }
  if (multi || result.ary === 0) {
    outer: for (const info of tokenInfos) {
      if (!info.merged) continue;
      const reading = prolongedToVowel(info.reading);
      const moras = divideMora(reading);
      const internal = findInternalGomamayo(moras, higher);
      for (const match of internal) {
        if (higher || match.degree === 1) {
          const beforeMoras = moras.slice(0, match.position);
          const afterMoras = moras.slice(match.position);
          result.matches.push({
            words: [info.surface, info.surface],
            readings: [beforeMoras.join(""), afterMoras.join("")],
            degree: match.degree,
            position: match.position
          });
          result.degree = Math.max(result.degree, match.degree);
          result.ary++;
          if (!multi) break outer;
        }
      }
    }
  }
  result.isGomamayo = result.ary > 0;
  return result;
}
async function isGomamayo(input, options = {}) {
  return (await analyze(input, options)).isGomamayo;
}
async function find(input, options = {}) {
  const result = await analyze(input, options);
  return result.isGomamayo ? result.matches : null;
}
var src_default = { analyze, isGomamayo, find, clearTokenizerCache };
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyze,
  clearTokenizerCache,
  find,
  isGomamayo
});
