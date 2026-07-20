# Changelog

## 2.0.0

### 破壊的変更

- `postinstall` での辞書ダウンロード(約380MB)を廃止しました。`npm install` だけで動作します
- `kuromoji-neologd` への依存を削除しました。固有名詞の読みは [SudachiDict](https://github.com/WorksApplications/SudachiDict) から生成した読み表 (`dict/readings.tsv.gz`、約138万語/14MB) で解決します
- `useNeologd` オプションを `useDict` に改名しました (旧名はエイリアスとして動作します)
- CLI の `--neologd` を `--dict` に改名しました (旧名は非表示エイリアスとして動作します)
- `engines.node: ">=22.0.0"` になりました
- ビルド成果物 (`dist/`) をリポジトリにコミットしない構成に変更しました

### 新機能

- ユーザー辞書: `addUserWords` / `removeUserWords` / `clearUserWords`、`analyze` の `userDict` オプション、CLI の `--user-dict <tsv>` で固有名詞や造語を自由に追加できます
- 文中の固有名詞ゴママヨも検出できるようになりました (v1 は入力全体が固有名詞の場合のみ)

### 改善

- 解析時のメモリ使用量が GB 級 → 数百MB程度に減少しました
- ビルドを tsup に移行し、ESM/CJS 両対応の型定義 (`.d.ts` / `.d.cts`) を出力するようになりました
- TypeScript 7 (ネイティブ実装) を導入しました。型定義は `tsc` で直接生成し、テストの TS 変換は ts-jest から `@swc/jest` に移行しました
- かな変換を [wanakana](https://www.npmjs.com/package/wanakana) に置き換え、かな処理を `src/kana.ts` に集約しました
- GitHub Actions: publish 時に `v{version}` タグと GitHub Release を自動作成、SudachiDict の月次自動追従 (`update-dict`)、Node 18/20/22 での CI を追加しました

### 1.x からの移行

```diff
- await analyze('博麗霊夢', { useNeologd: false });
+ await analyze('博麗霊夢', { useDict: false });
```

そのほかの API (`analyze` / `isGomamayo` / `find` / `clearTokenizerCache`) は互換です。
1.x の `postinstall` が参照する `dict` リリースは互換性のため残されています。
