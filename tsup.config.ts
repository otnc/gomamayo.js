import { defineConfig } from "tsup";

// dts は tsup ではなく tsc (tsconfig.build.json) で生成する。
// tsup の dts 生成 (rollup-plugin-dts) は TypeScript 7 が廃止した
// Program API に依存しており、TS7 環境では動作しない。
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
