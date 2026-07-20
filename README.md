# gomamayo

MeCab不要のゴママヨ検出ライブラリ

[kuromoji.js](https://www.npmjs.com/package/kuromoji) の分かち書きに、[SudachiDict](https://github.com/WorksApplications/SudachiDict) から生成した固有名詞の読み表を重ねて解析します。
「博麗霊夢(ハクレイ|レイム)」のような固有名詞のゴママヨも検出できます。

> [!NOTE]
>   
> v2.0.0 で辞書構成を刷新しました。
>
> - `postinstall` での辞書ダウンロード(約380MB)を廃止し、`npm install` だけで即使えるようになりました
> - 巨大な NEologd 辞書(2020年から更新停止)の代わりに、四半期更新されている SudachiDict 由来の読み表(約13MB)を同梱しています
> - 解析時のメモリ使用量が GB 級 → 数百MB程度に減りました
> - `useNeologd` オプションは `useDict` に改名されました(旧名もエイリアスとして動作します)

## Install

```bash
npm install gomamayo
```

Node.js 22 以上が必要です。

## Usage

### プログラムから使用

```js
// ESM
import { analyze } from 'gomamayo';
// CJS
const { analyze } = require('gomamayo');

(async () => {
  // 1次ゴママヨの例
  const result1 = await analyze('ごまマヨネーズ');
  console.log(result1.isGomamayo); // true
  console.log(result1.degree); // 1
  console.log(result1.matches[0]?.words); // ['ごま', 'マヨネーズ']

  // 2次ゴママヨの例 (固有名詞)
  const result2 = await analyze('博麗霊夢');
  console.log(result2.isGomamayo); // true
  console.log(result2.degree); // 2
  console.log(result2.matches[0]?.readings); // ['ハクレイ', 'レイム']
})();
```

> [!WARNING]
>   
> `isGomamayo` が `false` の場合、`matches` は空配列です。`matches[0]` に直接アクセスせず、`?.` を使うか `isGomamayo`/`matches.length` を確認してください。

### オプション

```javascript
// 高次ゴママヨを検出しない（1次のみ）
await analyze('博麗霊夢', { higher: false });

// 多項ゴママヨを検出しない（最初の1項のみ）
await analyze('太鼓公募募集終了', { multi: false });

// 固有名詞の読み辞書を使用しない（メモリ節約、ただし固有名詞の検出精度が低下）
await analyze('博麗霊夢', { useDict: false });
```

### ユーザー辞書

同梱辞書にない固有名詞や造語は、ユーザー辞書で追加できます。
ユーザー辞書は同梱辞書より優先され、既知の単語の読みの上書きにも使えます。

```javascript
import { analyze, addUserWords, removeUserWords, clearUserWords } from 'gomamayo';

// プロセス全体に登録 (読みはひらがな/カタカナ)
addUserWords({ サイレンススズカ: 'さいれんすすずか' });
await analyze('サイレンススズカ'); // isGomamayo: true (サイレンス|スズカ)

removeUserWords(['サイレンススズカ']); // 個別削除
clearUserWords(); // 全削除

// 1回の呼び出しにだけ適用する場合
await analyze('サイレンススズカ', { userDict: { サイレンススズカ: 'さいれんすすずか' } });
```

CLI では TSV ファイル (1行につき `表記<TAB>読み`、`#` で始まる行はコメント) を渡せます。

```bash
npx gomamayo サイレンススズカ --user-dict mydict.tsv
```

### メモリ管理

辞書は一度ロードするとキャッシュされ、以降の呼び出しでは再利用されます。
使用後にメモリを解放したい場合は `clearTokenizerCache` を使用してください。

```javascript
import { analyze, clearTokenizerCache } from 'gomamayo';

// 解析を実行
const result = await analyze('ごまマヨネーズ');

// 辞書キャッシュをクリアしてメモリを解放
clearTokenizerCache(); // 全ての辞書を解放
clearTokenizerCache('dict'); // 読み辞書のみ解放
clearTokenizerCache('ipadic'); // ipadic辞書のみ解放
```

## CLI

```bash
# 1次ゴママヨ
npx gomamayo ごまマヨネーズ

# 2次ゴママヨ
npx gomamayo 博麗霊夢

# オプション
npx gomamayo 博麗霊夢 --higher false  # 高次検出なし
npx gomamayo 太鼓公募募集終了 --multi false  # 多項検出なし
npx gomamayo ごまマヨネーズ --dict false  # 読み辞書なし（省メモリ）
```

## API

### `analyze(input, options?)`

ゴママヨを解析して詳細な結果を返します。

### `isGomamayo(input, options?)`

ゴママヨかどうかを `boolean` で返します。

### `find(input, options?)`

ゴママヨの場合は `GomamayoMatch[]` を、そうでなければ `null` を返します。

### `addUserWords(words)` / `removeUserWords(surfaces)` / `clearUserWords()`

ユーザー辞書を操作します。`words` は `{ 表記: 読み }` のオブジェクトで、読みはひらがな/カタカナで指定します。

### `clearTokenizerCache(type?)`

トークナイザー・辞書のキャッシュをクリアしてメモリを解放します。

- `type`: `'ipadic'` | `'dict'` | `'all'` (デフォルト: `'all'`)
  - `'neologd'` は v1 互換のエイリアスで `'dict'` と同じ扱いです

## 辞書について

- 分かち書き・基本語彙の読み: [kuromoji.js](https://www.npmjs.com/package/kuromoji) 同梱の IPADIC 辞書
- 固有名詞の読み: [SudachiDict](https://github.com/WorksApplications/SudachiDict) の語彙表から生成した読み表 (`dict/readings.tsv.gz`、約138万語)

読み表 (`dict/readings.tsv.gz`) はリポジトリにはコミットされておらず、`npm run build:dict` で SudachiDict (AWS S3) から生成します。CI ではバージョンごとにキャッシュし、キャッシュがない場合のみ生成するため、失敗時(AWS障害など)はそこでジョブが止まります。npm に公開されるパッケージにはビルド済みのものが同梱されます。

## 貢献

コントリビューションを歓迎します！詳細は[コントリビューションガイドライン](./CONTRIBUTING.md)をご覧ください。

## 貢献者

[![Contributors](https://contrib.rocks/image?repo=otnc/gomamayo.js)](https://github.com/otnc/gomamayo.js/graphs/contributors)

## 参考

- https://3qua9la-notebook.hatenablog.com/entry/2021/04/10/220317
- https://github.com/Hayao0819/Awesome-Gomamayo
- https://github.com/jugesuke/gomamayo
- https://github.com/ThinaticSystem/gomamayo.js
  - https://www.npmjs.com/package/gomamayo-js

## ライセンス

このパッケージは [MIT License](./LICENSE) で提供されています。

> [!WARNING]
> このパッケージ自体は MIT License ですが、Apache License 2.0 の依存リソース（[kuromoji.js](https://www.npmjs.com/package/kuromoji) の IPADIC 辞書、および [SudachiDict](https://github.com/WorksApplications/SudachiDict) 由来の読み表データ）を使用しています。これらのライセンス条項も適用されます。
