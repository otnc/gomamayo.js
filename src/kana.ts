import wanakana from "wanakana";

/** ひらがなをカタカナに変換する (かな以外の文字はそのまま通す) */
export function hiraToKata(str: string): string {
  return wanakana.toKatakana(str, { passRomaji: true });
}

/**
 * 入力の正規化。
 * NFKC 正規化 (全角英数の半角化・半角カナの全角化を含む) + 空白除去
 */
export function normalize(str: string): string {
  return str.normalize("NFKC").replace(/\s+/g, "");
}

/**
 * モーラ分割の正規表現。
 * 拗音・外来音 (キャ, ファ, ティ など) を後続の小書き文字とまとめて
 * 1モーラとして扱う。モーラ分割を提供する保守された npm パッケージは
 * 存在しないため自前で実装している。
 */
const MORA_PATTERN =
  /[ウクスツヌフムユルグズヅブプヴ][ァィェォ]|[イキシチニヒミリギジヂビピ][ャュェョ]|[テデ][ィュ]|[ァ-ヴー]/g;

/** カタカナ文字列をモーラ配列に分割する */
export function divideMora(str: string): string[] {
  return str.match(MORA_PATTERN) ?? [];
}

/**
 * カナ → その母音 (長音「ー」の解決専用)。
 * ン・ッは母音を持たないためそのまま維持する。
 * ローマ字変換 (wanakana.toRomaji) からも導出できるが、
 * ン/ッ/ヲなどの特殊ケースを明示するためテーブルで保持している。
 */
const VOWEL_MAP: Record<string, string> = {
  ア: "ア",
  イ: "イ",
  ウ: "ウ",
  エ: "エ",
  オ: "オ",
  カ: "ア",
  キ: "イ",
  ク: "ウ",
  ケ: "エ",
  コ: "オ",
  サ: "ア",
  シ: "イ",
  ス: "ウ",
  セ: "エ",
  ソ: "オ",
  タ: "ア",
  チ: "イ",
  ツ: "ウ",
  テ: "エ",
  ト: "オ",
  ナ: "ア",
  ニ: "イ",
  ヌ: "ウ",
  ネ: "エ",
  ノ: "オ",
  ハ: "ア",
  ヒ: "イ",
  フ: "ウ",
  ヘ: "エ",
  ホ: "オ",
  マ: "ア",
  ミ: "イ",
  ム: "ウ",
  メ: "エ",
  モ: "オ",
  ヤ: "ア",
  ユ: "ウ",
  ヨ: "オ",
  ラ: "ア",
  リ: "イ",
  ル: "ウ",
  レ: "エ",
  ロ: "オ",
  ワ: "ア",
  ヲ: "オ",
  ン: "ン",
  ガ: "ア",
  ギ: "イ",
  グ: "ウ",
  ゲ: "エ",
  ゴ: "オ",
  ザ: "ア",
  ジ: "イ",
  ズ: "ウ",
  ゼ: "エ",
  ゾ: "オ",
  ダ: "ア",
  ヂ: "イ",
  ヅ: "ウ",
  デ: "エ",
  ド: "オ",
  バ: "ア",
  ビ: "イ",
  ブ: "ウ",
  ベ: "エ",
  ボ: "オ",
  パ: "ア",
  ピ: "イ",
  プ: "ウ",
  ペ: "エ",
  ポ: "オ",
  ァ: "ア",
  ィ: "イ",
  ゥ: "ウ",
  ェ: "エ",
  ォ: "オ",
  ャ: "ア",
  ュ: "ウ",
  ョ: "オ",
  ッ: "ッ",
  ヴ: "ウ",
};

/**
 * 長音「ー」を直前のモーラの母音に置き換える。
 * 例: ルータ → ルウタ (境界比較で「ウ」として扱えるようにする)
 */
export function prolongedToVowel(str: string): string {
  const moras = divideMora(str);
  if (moras.length === 0) return str;
  const first = moras[0];
  if (!first) return str;

  const result: string[] = [first];
  for (let i = 1; i < moras.length; i++) {
    const current = moras[i];
    if (!current) continue;
    if (current === "ー") {
      const prevMora = moras[i - 1];
      if (prevMora) {
        const lastChar = prevMora[prevMora.length - 1];
        result.push(lastChar ? (VOWEL_MAP[lastChar] ?? lastChar) : current);
      } else {
        result.push(current);
      }
    } else {
      result.push(current);
    }
  }
  return result.join("");
}
