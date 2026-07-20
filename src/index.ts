import kuromoji, { Tokenizer, IpadicFeatures } from "kuromoji";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { ReadingDict } from "./reading-dict.js";
import { hiraToKata, normalize, divideMora, prolongedToVowel } from "./kana.js";

// tsupのshims設定により、import.meta.url はCJSビルドでも利用できる
const requireFn = createRequire(import.meta.url);
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const getIpadicDictPath = (): string => {
  try {
    const pkgJson = requireFn.resolve("kuromoji/package.json");
    const dictPath = path.join(path.dirname(pkgJson), "dict");
    if (fs.existsSync(dictPath)) {
      return dictPath;
    }
  } catch {}
  return path.join(packageRoot, "node_modules", "kuromoji", "dict");
};

const getReadingDictPath = (): string =>
  path.join(packageRoot, "dict", "readings.tsv.gz");

export interface GomamayoOptions {
  higher?: boolean;
  multi?: boolean;
  /** 固有名詞の読み辞書を使用するか (デフォルト: true) */
  useDict?: boolean;
  /** この呼び出しにのみ適用するユーザー辞書 (表記→読み、かな表記) */
  userDict?: Record<string, string>;
  /** @deprecated `useDict` を使用してください */
  useNeologd?: boolean;
}

export interface GomamayoMatch {
  words: [string, string];
  readings: [string, string];
  degree: number;
  position: number;
}

export interface GomamayoResult {
  isGomamayo: boolean;
  matches: GomamayoMatch[];
  degree: number;
  ary: number;
  input: string;
  reading: string;
}

function getReading(token: IpadicFeatures): string {
  const reading = token.reading ?? token.surface_form;
  return hiraToKata(reading);
}

let ipadicTokenizer: Promise<Tokenizer<IpadicFeatures>> | null = null;
let readingDict: ReadingDict | null = null;

function getIpadicTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (!ipadicTokenizer) {
    ipadicTokenizer = new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: getIpadicDictPath() })
        .build((err, tokenizer) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
  }
  return ipadicTokenizer;
}

function getReadingDict(): ReadingDict {
  if (!readingDict) {
    readingDict = ReadingDict.loadSync(getReadingDictPath());
  }
  return readingDict;
}

/** 読みを引ける辞書の共通インターフェース (ReadingDict も構造的に満たす) */
interface DictSource {
  maxSurfaceLength: number;
  lookup(surface: string): string | null;
}

const KANA_READING = /^[ァ-ヴー]+$/;

function toUserDictMap(words: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [rawSurface, rawReading] of Object.entries(words)) {
    const surface = normalize(rawSurface);
    const reading = hiraToKata(normalize(rawReading));
    if (surface.length === 0) {
      throw new Error(`ユーザー辞書の表記が空です: "${rawSurface}"`);
    }
    if (!KANA_READING.test(reading)) {
      throw new Error(
        `ユーザー辞書の読みはかな表記で指定してください: "${rawSurface}" -> "${rawReading}"`,
      );
    }
    map.set(surface, reading);
  }
  return map;
}

function mapToDictSource(map: Map<string, string>): DictSource {
  let maxLen = 0;
  for (const surface of map.keys()) {
    if (surface.length > maxLen) maxLen = surface.length;
  }
  return {
    maxSurfaceLength: maxLen,
    lookup: (surface) => map.get(surface) ?? null,
  };
}

const globalUserDict = new Map<string, string>();

/** ユーザー辞書に語を追加する (プロセス全体で有効) */
export function addUserWords(words: Record<string, string>): void {
  for (const [surface, reading] of toUserDictMap(words)) {
    globalUserDict.set(surface, reading);
  }
}

/** ユーザー辞書から語を削除する */
export function removeUserWords(surfaces: string[]): void {
  for (const surface of surfaces) {
    globalUserDict.delete(normalize(surface));
  }
}

/** ユーザー辞書を空にする */
export function clearUserWords(): void {
  globalUserDict.clear();
}

function composeDictSources(sources: DictSource[]): DictSource | null {
  const active = sources.filter((s) => s.maxSurfaceLength > 0);
  if (active.length === 0) return null;
  if (active.length === 1) return active[0]!;
  return {
    maxSurfaceLength: Math.max(...active.map((s) => s.maxSurfaceLength)),
    lookup: (surface) => {
      for (const source of active) {
        const reading = source.lookup(surface);
        if (reading) return reading;
      }
      return null;
    },
  };
}

/** トークナイザー・辞書のキャッシュをクリアしてメモリを解放する ('neologd' は 'dict' の互換エイリアス) */
export function clearTokenizerCache(
  type: "ipadic" | "dict" | "neologd" | "all" = "all",
): void {
  if (type === "ipadic" || type === "all") {
    ipadicTokenizer = null;
  }
  if (type === "dict" || type === "neologd" || type === "all") {
    readingDict = null;
  }
  // ガベージコレクションを促すヒント (--expose-gc 実行時のみ)
  const g = globalThis as { gc?: () => void };
  if (g.gc) {
    g.gc();
  }
}

function findMaxDegree(formerMora: string[], laterMora: string[]): number {
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

function findInternalGomamayo(
  moras: string[],
  higher: boolean,
): { degree: number; position: number }[] {
  const results: { degree: number; position: number }[] = [];
  const maxDegree = higher ? Math.floor(moras.length / 2) : 1;

  for (let pos = 1; pos < moras.length; pos++) {
    for (
      let deg = 1;
      deg <= Math.min(maxDegree, pos, moras.length - pos);
      deg++
    ) {
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

interface TokenInfo {
  surface: string;
  reading: string;
  /** 読み辞書により複数トークンを1語に統合したもの(固有名詞) */
  merged: boolean;
}

// トークン境界を最長一致で辞書に照合し、複数トークンにまたがる固有名詞を
// 辞書の読みを持つ1語に統合する。override (ユーザー辞書) は既知語の読みも上書きする
function applyReadingDict(
  tokens: IpadicFeatures[],
  text: string,
  dict: DictSource,
  override: DictSource | null,
): TokenInfo[] {
  const starts: number[] = [];
  let acc = 0;
  for (const token of tokens) {
    starts.push(acc);
    acc += token.surface_form.length;
  }

  const infos: TokenInfo[] = [];
  let i = 0;
  while (i < tokens.length) {
    const start = starts[i]!;

    // 辞書の最長表記を超えない範囲で、最も遠いトークン境界から試す
    let j = i;
    while (
      j + 1 < tokens.length &&
      starts[j + 1]! + tokens[j + 1]!.surface_form.length - start <=
        dict.maxSurfaceLength
    ) {
      j++;
    }

    let merged = false;
    for (; j > i; j--) {
      const end = starts[j]! + tokens[j]!.surface_form.length;
      const surface = text.slice(start, end);
      const reading = dict.lookup(surface);
      if (reading) {
        infos.push({ surface, reading, merged: true });
        i = j + 1;
        merged = true;
        break;
      }
    }
    if (merged) continue;

    const token = tokens[i]!;
    let reading = override?.lookup(token.surface_form) ?? token.reading;
    if (!reading) {
      reading = dict.lookup(token.surface_form) ?? token.surface_form;
    }
    infos.push({
      surface: token.surface_form,
      reading: hiraToKata(reading),
      merged: false,
    });
    i++;
  }
  return infos;
}

export async function analyze(
  input: string,
  options: GomamayoOptions = {},
): Promise<GomamayoResult> {
  const { higher = true, multi = true } = options;
  const useDict = options.useDict ?? options.useNeologd ?? true;

  const tokenizer = await getIpadicTokenizer();

  // ユーザー辞書(呼び出し単位 → グローバル)を同梱辞書より優先して重ねる
  const userSources: DictSource[] = [];
  if (options.userDict) {
    userSources.push(mapToDictSource(toUserDictMap(options.userDict)));
  }
  if (globalUserDict.size > 0) {
    userSources.push(mapToDictSource(globalUserDict));
  }
  const override = composeDictSources(userSources);
  const dict = composeDictSources([
    ...userSources,
    ...(useDict ? [getReadingDict()] : []),
  ]);

  const normalized = normalize(input);
  const tokens = tokenizer.tokenize(normalized);

  const tokenInfos: TokenInfo[] = dict
    ? applyReadingDict(tokens, normalized, dict, override)
    : tokens.map((token) => ({
        surface: token.surface_form,
        reading: getReading(token),
        merged: false,
      }));

  const result: GomamayoResult = {
    isGomamayo: false,
    matches: [],
    degree: 0,
    ary: 0,
    input,
    reading: tokenInfos.map((t) => t.reading).join(""),
  };

  // 単語境界のゴママヨ検出
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
        position: i,
      });
      result.degree = Math.max(result.degree, deg);
      result.ary++;
      if (!multi) break;
    }
  }

  // 統合した固有名詞の内部のゴママヨ検出 (例: 博麗霊夢 = ハクレイ|レイム)
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
            position: match.position,
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

export async function isGomamayo(
  input: string,
  options: GomamayoOptions = {},
): Promise<boolean> {
  return (await analyze(input, options)).isGomamayo;
}

export async function find(
  input: string,
  options: GomamayoOptions = {},
): Promise<GomamayoMatch[] | null> {
  const result = await analyze(input, options);
  return result.isGomamayo ? result.matches : null;
}

export default {
  analyze,
  isGomamayo,
  find,
  clearTokenizerCache,
  addUserWords,
  removeUserWords,
  clearUserWords,
};
