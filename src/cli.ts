#!/usr/bin/env node
import fs from "node:fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  analyze,
  addUserWords,
  GomamayoOptions,
  GomamayoResult,
} from "./index.js";

interface Arguments {
  text: string;
  higher: boolean;
  multi: boolean;
  dict: boolean;
  userDict?: string;
  neologd?: boolean;
}

const argv = yargs(hideBin(process.argv))
  .scriptName("gomamayo")
  .usage("$0 <text>", "ゴママヨを検出します", (yargs) => {
    return yargs.positional("text", {
      describe: "解析するテキスト",
      type: "string",
      demandOption: true,
    });
  })
  .option("higher", {
    alias: "h",
    describe: "高次ゴママヨを検出するか",
    type: "boolean",
    default: true,
  })
  .option("multi", {
    alias: "m",
    describe: "多項ゴママヨを検出するか",
    type: "boolean",
    default: true,
  })
  .option("dict", {
    alias: "d",
    describe: "固有名詞の読み辞書を使用するか (メモリ節約のためfalseにできる)",
    type: "boolean",
    default: true,
  })
  .option("user-dict", {
    alias: "u",
    describe: "ユーザー辞書TSVのパス (1行につき 表記<TAB>読み、#はコメント)",
    type: "string",
  })
  .option("neologd", {
    describe: "[非推奨] --dict のv1互換エイリアス",
    type: "boolean",
    hidden: true,
  })
  .example("$0 ごまマヨネーズ", "基本的な使用方法")
  .example("$0 オレンジレンジ --higher true", "高次ゴママヨ検出あり")
  .example("$0 太鼓公募募集終了 --multi true", "多項ゴママヨ検出あり")
  .example("$0 ごまマヨネーズ --higher false", "高次ゴママヨ検出なし")
  .example("$0 ごまマヨネーズ --dict false", "読み辞書なし(省メモリ)")
  .example("$0 超会場祭 --user-dict mydict.tsv", "ユーザー辞書を追加")
  .help()
  .alias("help", "?")
  .version()
  .alias("version", "v")
  .parseSync() as unknown as Arguments;

(async function () {
  const inputText = argv.text;
  const options: GomamayoOptions = {
    higher: argv.higher,
    multi: argv.multi,
    useDict: argv.neologd ?? argv.dict,
  };

  console.log(`入力文字列: ${inputText}`);
  console.log(
    `オプション: higher=${options.higher}, multi=${options.multi}, useDict=${options.useDict}`,
  );
  console.log("");

  try {
    if (argv.userDict) {
      addUserWords(parseUserDictFile(argv.userDict));
    }
    const result = await analyze(inputText, options);
    printResult(result);
  } catch (error) {
    console.error("エラーが発生しました:");
    console.error(error);
    process.exit(1);
  }
})();

function parseUserDictFile(filePath: string): Record<string, string> {
  const words: Record<string, string> = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [surface, reading] = trimmed.split("\t");
    if (!surface || !reading) {
      throw new Error(`ユーザー辞書の形式が不正です: "${line}"`);
    }
    words[surface] = reading;
  }
  return words;
}

function printResult(result: GomamayoResult): void {
  console.log("=== 解析結果 ===");
  console.log(`ゴママヨ: ${result.isGomamayo ? "検出" : "未検出"}`);

  if (result.isGomamayo) {
    console.log(`次数: ${result.degree}次`);
    console.log(`項数: ${result.ary}項`);
    console.log(`読み: ${result.reading}`);
    console.log("");

    console.log("=== 検出箇所 ===");
    result.matches.forEach((match, i) => {
      const marker = match.degree > 1 ? `(${match.degree}次)` : "";
      console.log(`[${i + 1}] ${match.words[0]} + ${match.words[1]} ${marker}`);
      console.log(`    読み: ${match.readings[0]} + ${match.readings[1]}`);
    });
  }
}
