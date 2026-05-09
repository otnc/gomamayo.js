# gomamayo

MeCab不要のゴママヨ検出ライブラリ

[kuromoji.js](https://www.npmjs.com/package/kuromoji) とそのdict、 [kuromoji-ipadic-neologd](https://www.npmjs.com/package/kuromoji-neologd) のdict を使用して精度を向上させています。  
固有名詞のゴママヨも一応検出可能です。

> [!WARNING]  
> 使用している辞書のサイズが非常に大きく、判定時の `kuromoji.builder({ dicPath }).build((err, tokenizer) => { ... });` でかなり膨大なメモリを消費します(Linux環境での検証時は4GB程度)  
> メモリに余裕がない環境で使用する際は、判定の制度は下がりますが `useNeologd` を `false` に設定することをおすすめします。

> [!NOTE]  
> 使用している辞書のサイズが非常に大きく、導入のためのスクリプトが特殊なため、開発者の環境ではインストールに3分ほど要しました。  
> [自作のゴママヨ判定のインストールに3分も掛かるという動画(YouTube)](https://youtu.be/jKc3m-9EHko)  
> ~~スクリプトなどを改善し、現在は開発者の環境では1分未満でインストールが可能になりました。 (v1.1.3 より)~~

## Install

以下の操作のみで使用できるはずです。

```bash
npm install gomamayo
```

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
  console.log(result1.matches[0].words); // ['ごま', 'マヨネーズ']

  // 2次ゴママヨの例
  const result2 = await analyze('博麗霊夢');
  console.log(result2.isGomamayo); // true
  console.log(result2.degree); // 2
  console.log(result2.matches[0].readings); // ['ハクレイ', 'レイム']
})();
```

### オプション

```javascript
// 高次ゴママヨを検出しない（1次のみ）
await analyze('博麗霊夢', { higher: false });

// 多項ゴママヨを検出しない（最初の1項のみ）
await analyze('太鼓公募募集終了', { multi: false });

// neologd辞書を使用しない（メモリ節約、ただし固有名詞の検出精度が低下）
await analyze('博麗霊夢', { useNeologd: false });
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
clearTokenizerCache('neologd'); // neologd辞書のみ解放
clearTokenizerCache('ipadic'); // ipadic辞書のみ解放
```

> [!TIP]  
> メモリ使用量を抑えたい場合：
> - `useNeologd: false` を指定すると、neologd辞書をロードせずに解析できます（約50%のメモリ削減）
> - 解析後に `clearTokenizerCache()` を呼び出すと、辞書をメモリから解放できます

## CLI

```bash
# 1次ゴママヨ
npx gomamayo ごまマヨネーズ

# 2次ゴママヨ
npx gomamayo 博麗霊夢

# オプション
npx gomamayo 博麗霊夢 --higher false  # 高次検出なし
npx gomamayo 太鼓公募募集終了 --multi false  # 多項検出なし
npx gomamayo ごまマヨネーズ --neologd false  # neologd辞書なし（省メモリ）
```

## API

### `analyze(input, options?)`

ゴママヨを解析して詳細な結果を返します。

### `isGomamayo(input, options?)`

ゴママヨかどうかを `boolean` で返します。

### `find(input, options?)`

ゴママヨの場合は `GomamayoMatch[]` を、そうでなければ `null` を返します。

### `clearTokenizerCache(type?)`

トークナイザーのキャッシュをクリアしてメモリを解放します。

- `type`: `'ipadic'` | `'neologd'` | `'all'` (デフォルト: `'all'`)

## 貢献

コントリビューションを歓迎します！詳細は[コントリビューションガイドライン](./CONTRIBUTING.md)をご覧ください。

## 貢献者

[![Contributors](https://contrib.rocks/image?repo=otoneko1102/gomamayo.js)](https://github.com/otnc/gomamayo.js/graphs/contributors)

## 参考

- https://3qua9la-notebook.hatenablog.com/entry/2021/04/10/220317
- https://github.com/Hayao0819/Awesome-Gomamayo
- https://github.com/jugesuke/gomamayo
- https://github.com/ThinaticSystem/gomamayo.js
  - https://www.npmjs.com/package/gomamayo-js

> [!WARNING]  
> このパッケージは Apache License 2.0 の依存ライブラリ（[kuromoji.js](https://www.npmjs.com/package/kuromoji) および [kuromoji-ipadic-neologd](https://www.npmjs.com/package/kuromoji-neologd)）を使用しています。このパッケージ自体は MIT License ですが、これらの依存関係のライセンス条項も適用されます。