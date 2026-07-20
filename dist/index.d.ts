interface GomamayoOptions {
    higher?: boolean;
    multi?: boolean;
    /** 固有名詞の読み辞書を使用するか (デフォルト: true) */
    useDict?: boolean;
    /**
     * この呼び出しでのみ使用するユーザー辞書 (表記→読み)。
     * 読みはひらがな/カタカナで指定する。`addUserWords` と同様に
     * 同梱辞書より優先される
     */
    userDict?: Record<string, string>;
    /** @deprecated v1互換エイリアス。`useDict` を使用してください */
    useNeologd?: boolean;
}
interface GomamayoMatch {
    words: [string, string];
    readings: [string, string];
    degree: number;
    position: number;
}
interface GomamayoResult {
    isGomamayo: boolean;
    matches: GomamayoMatch[];
    degree: number;
    ary: number;
    input: string;
    reading: string;
}
/**
 * ユーザー辞書に語を追加する (プロセス全体で有効)
 * @param words 表記→読み(ひらがな/カタカナ) のマップ
 * @example addUserWords({ 博麗霊夢: "はくれいれいむ" })
 */
declare function addUserWords(words: Record<string, string>): void;
/** ユーザー辞書から語を削除する */
declare function removeUserWords(surfaces: string[]): void;
/** ユーザー辞書を空にする */
declare function clearUserWords(): void;
/**
 * トークナイザー・辞書のキャッシュをクリアしてメモリを解放する
 * @param type 'ipadic' | 'dict' | 'all' (デフォルト: 'all')
 *   'neologd' はv1互換のエイリアスで 'dict' と同じ扱い
 */
declare function clearTokenizerCache(type?: "ipadic" | "dict" | "neologd" | "all"): void;
declare function analyze(input: string, options?: GomamayoOptions): Promise<GomamayoResult>;
declare function isGomamayo(input: string, options?: GomamayoOptions): Promise<boolean>;
declare function find(input: string, options?: GomamayoOptions): Promise<GomamayoMatch[] | null>;
declare const _default: {
    analyze: typeof analyze;
    isGomamayo: typeof isGomamayo;
    find: typeof find;
    clearTokenizerCache: typeof clearTokenizerCache;
    addUserWords: typeof addUserWords;
    removeUserWords: typeof removeUserWords;
    clearUserWords: typeof clearUserWords;
};

export { type GomamayoMatch, type GomamayoOptions, type GomamayoResult, addUserWords, analyze, clearTokenizerCache, clearUserWords, _default as default, find, isGomamayo, removeUserWords };
