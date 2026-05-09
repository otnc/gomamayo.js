
import fs from "fs";
import path from "path";
import url from "node:url";
import { Readable } from "stream";
import unzip from "unzip-stream";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const DICT_URL =
  "https://github.com/otnc/gomamayo.js/releases/download/dict/dict.zip";
const outputPath = path.resolve(rootDir, "lib");
const fetchFn = globalThis.fetch?.bind(globalThis);

async function downloadAndExtract(fileUrl, outputDir) {
  if (!fetchFn) {
    throw new Error(
      "Fetch API is not available. Please use Node.js 18+ or install a fetch polyfill.",
    );
  }
  const res = await fetchFn(fileUrl, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${fileUrl}: ${res.statusText}`);
  if (!res.body) throw new Error("Response body is empty.");
  const source =
    typeof res.body.pipe === "function"
      ? res.body
      : Readable.fromWeb(res.body);

  await new Promise((resolve, reject) => {
    const extractor = unzip.Extract({ path: outputDir });
    extractor.on("close", resolve);
    extractor.on("error", reject);
    source.on("error", reject);
    source.pipe(extractor);
  });
}

(async () => {
  try {
    // 既にlibが存在する場合はスキップ
    const kuromojiPath = path.join(outputPath, "kuromoji");
    const neologdPath = path.join(outputPath, "kuromoji-neologd");

    // 両方のディレクトリが存在し、かつファイルが含まれているかチェック
    const kuromojiExists =
      fs.existsSync(kuromojiPath) && fs.readdirSync(kuromojiPath).length > 0;
    const neologdExists =
      fs.existsSync(neologdPath) && fs.readdirSync(neologdPath).length > 0;

    if (kuromojiExists && neologdExists) {
      console.log("[postinstall] Dictionaries already exist, skipping...");
      return;
    }

    console.log(`[postinstall] Downloading dictionaries from ${DICT_URL}...`);
    fs.mkdirSync(outputPath, { recursive: true });
    await downloadAndExtract(DICT_URL, outputPath);
    console.log(`[postinstall] Extracted to ${outputPath}`);

    // 展開後の確認
    if (fs.existsSync(kuromojiPath)) {
      console.log(
        `[postinstall] ✓ kuromoji extracted (${fs.readdirSync(kuromojiPath).length} files)`,
      );
    } else {
      console.log(`[postinstall] ✗ kuromoji not found`);
    }
    if (fs.existsSync(neologdPath)) {
      console.log(
        `[postinstall] ✓ kuromoji-neologd extracted (${fs.readdirSync(neologdPath).length} files)`,
      );
    } else {
      console.log(`[postinstall] ✗ kuromoji-neologd not found`);
    }
  } catch (error) {
    console.error(`[postinstall] Error: ${error.message}`);
    console.error(
      "[postinstall] Failed to download dictionaries. Falling back to node_modules...",
    );

    // フォールバック: node_modulesからコピー
    try {
      const dictSources = [
        {
          name: "kuromoji",
          src: path.join(rootDir, "node_modules", "kuromoji", "dict"),
          dest: path.join(outputPath, "kuromoji"),
        },
        {
          name: "kuromoji-neologd",
          src: path.join(rootDir, "node_modules", "kuromoji-neologd", "dict"),
          dest: path.join(outputPath, "kuromoji-neologd"),
        },
      ];

      for (const { name, src, dest } of dictSources) {
        if (!fs.existsSync(src)) {
          console.log(`[postinstall] ${name} not found at ${src}, skipping...`);
          continue;
        }
        if (fs.existsSync(dest)) {
          console.log(`[postinstall] ${name} already exists, skipping...`);
          continue;
        }
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        for (const file of files) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file));
        }
        console.log(`[postinstall] Copied ${name} to ${dest}`);
      }
    } catch (fallbackError) {
      console.error(`[postinstall] Fallback failed: ${fallbackError.message}`);
    }
  }
})();
