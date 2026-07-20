import fs from "node:fs";
import zlib from "node:zlib";

const TAB = 0x09;
const NL = 0x0a;

// 表記\t読み の行を表記のUTF-8バイト順でソートしたTSV。Buffer のまま二分探索で
// 引くことで、Map 等に展開せずメモリ使用量を生TSVサイズ程度に抑える
export class ReadingDict {
  private readonly buf: Buffer;
  private readonly offsets: Uint32Array;
  /** 最長表記のUTF-8バイト長。コードユニット長の上限としても使える */
  readonly maxSurfaceLength: number;
  readonly size: number;

  constructor(tsv: Buffer) {
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

  static loadSync(filePath: string): ReadingDict {
    return new ReadingDict(zlib.gunzipSync(fs.readFileSync(filePath)));
  }

  /** 表記と完全一致するエントリの読み(カタカナ)を返す */
  lookup(surface: string): string | null {
    const key = Buffer.from(surface, "utf8");
    let lo = 0;
    let hi = this.size - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const cmp = this.compareAt(this.offsets[mid]!, key);
      if (cmp === 0) {
        return this.readingAt(this.offsets[mid]!);
      } else if (cmp < 0) {
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return null;
  }

  /** 行の表記部分とkeyをバイト比較する (エントリ < key: 負, 一致: 0, エントリ > key: 正) */
  private compareAt(offset: number, key: Buffer): number {
    for (let i = 0; ; i++) {
      const b = this.buf[offset + i];
      const entryEnded = b === TAB || b === undefined;
      if (i >= key.length) return entryEnded ? 0 : 1;
      if (entryEnded) return -1;
      if (b !== key[i]) return b! < key[i]! ? -1 : 1;
    }
  }

  private readingAt(offset: number): string {
    let tab = offset;
    while (this.buf[tab] !== TAB) tab++;
    let end = tab + 1;
    while (end < this.buf.length && this.buf[end] !== NL) end++;
    return this.buf.toString("utf8", tab + 1, end);
  }
}
