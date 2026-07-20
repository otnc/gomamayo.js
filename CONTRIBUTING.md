# 貢献

コントリビューションを歓迎します！

## セットアップ

Node.js 22 以上が必要です。

```bash
npm ci # package-lock.json 通りにインストール (CIと同じ)
npm run build:dict # 読み表 (dict/readings.tsv.gz) を生成。コミットされていないので初回に必須
```

`build:dict` は SudachiDict の生語彙 (約60MB) を AWS S3 からダウンロードします。一度生成すれば
`dict/` にキャッシュされるので、以降は再実行不要です(`test`・`typecheck` は `dist` のビルド無しで動きます)。

## 開発の流れ

- 変更は `main` への Pull Request として送ってください
- CLI の動作を手元で確認したい場合は `npm run build` で `dist/` を生成し、`node dist/cli.js <入力>` を実行してください
- 送る前に以下を通してください
  ```bash
  npm run format:check
  npm run typecheck
  npm test
  ```

## 歓迎する変更

- インストール時間を短縮するようなロジックの改善
- ゴママヨの検出漏れ・誤検出の修正(`test/index.test.ts` に再現テストを添えてください)
