interface GomamayoOptions {
    higher?: boolean;
    multi?: boolean;
    /** 固有名詞の読み辞書を使用するか (デフォルト: true) */
    useDict?: boolean;
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
};

export { type GomamayoMatch, type GomamayoOptions, type GomamayoResult, analyze, clearTokenizerCache, _default as default, find, isGomamayo };
