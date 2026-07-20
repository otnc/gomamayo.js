import { defineConfig } from "tsup";

// 型定義 (d.ts/d.cts) は tsup ではなく tsc (tsconfig.build.json) で生成する。
// TypeScript 7 (ネイティブ実装) には tsup の dts 生成が依存する JS API が無いため。
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    platform: "node",
    target: "node22",
    // CJSビルドでも import.meta.url を使えるようにする
    shims: true,
    clean: true,
    splitting: false,
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    platform: "node",
    target: "node22",
    shims: true,
    splitting: false,
  },
]);
