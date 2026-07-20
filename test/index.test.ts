import {
  analyze,
  isGomamayo,
  find,
  addUserWords,
  clearUserWords,
} from "../src/index";

describe("analyze", () => {
  test("ごまマヨネーズ is 1項1次", async () => {
    const result = await analyze("ごまマヨネーズ");
    expect(result.isGomamayo).toBe(true);
    expect(result.ary).toBe(1);
    expect(result.degree).toBe(1);
  });

  test("すいかカット is 1項1次", async () => {
    const result = await analyze("すいかカット");
    expect(result.isGomamayo).toBe(true);
    expect(result.ary).toBe(1);
    expect(result.degree).toBe(1);
  });

  test("無性生殖 is 2次ゴママヨ", async () => {
    const result = await analyze("無性生殖");
    expect(result.isGomamayo).toBe(true);
    expect(result.degree).toBe(2);
  });

  test("部分分数 is 2次ゴママヨ", async () => {
    const result = await analyze("部分分数");
    expect(result.isGomamayo).toBe(true);
    expect(result.degree).toBe(2);
  });

  test("オレンジレンジ is 3次ゴママヨ", async () => {
    const result = await analyze("オレンジレンジ");
    expect(result.isGomamayo).toBe(true);
    expect(result.degree).toBe(3);
  });

  test("太鼓公募募集終了 is 3項ゴママヨ", async () => {
    const result = await analyze("太鼓公募募集終了");
    expect(result.isGomamayo).toBe(true);
    expect(result.ary).toBe(3);
  });

  test("博麗霊夢 is 2次ゴママヨ (proper noun)", async () => {
    const result = await analyze("博麗霊夢");
    expect(result.isGomamayo).toBe(true);
    expect(result.degree).toBe(2);
  });

  test("higher option controls high-order detection", async () => {
    const withHigher = await analyze("部分分数", { higher: true });
    const withoutHigher = await analyze("部分分数", { higher: false });
    expect(withHigher.degree).toBe(2);
    expect(withHigher.isGomamayo).toBe(true);
    expect(withoutHigher.isGomamayo).toBe(false);
  });

  test("パパイヤ is not ゴママヨ (not compound)", async () => {
    const result = await analyze("パパイヤ");
    expect(result.isGomamayo).toBe(false);
  });

  test("パパイヤジュース is not ゴママヨ (no consecutive sound at boundary)", async () => {
    const result = await analyze("パパイヤジュース");
    expect(result.isGomamayo).toBe(false);
  });

  test("オレンジジュース is not ゴママヨ (visual only)", async () => {
    const result = await analyze("オレンジジュース");
    expect(result.isGomamayo).toBe(false);
  });

  test("multi option limits to single match", async () => {
    const withMulti = await analyze("モバイルルータ端末", { multi: true });
    const withoutMulti = await analyze("モバイルルータ端末", { multi: false });
    expect(withMulti.ary).toBeGreaterThanOrEqual(1);
    expect(withoutMulti.ary).toBeLessThanOrEqual(1);
  });
});

describe("isGomamayo", () => {
  test("returns true for ゴママヨ", async () => {
    expect(await isGomamayo("ごまマヨネーズ")).toBe(true);
  });

  test("returns false for non-ゴママヨ", async () => {
    expect(await isGomamayo("パパイヤ")).toBe(false);
  });
});

describe("user dictionary", () => {
  afterEach(() => {
    clearUserWords();
  });

  test("userDict option merges proper noun and detects internal gomamayo", async () => {
    const without = await analyze("超会場祭");
    expect(without.isGomamayo).toBe(false);

    const result = await analyze("超会場祭", {
      userDict: { 超会場祭: "ちょうかいかいさい" },
    });
    expect(result.isGomamayo).toBe(true);
    expect(result.degree).toBe(2);
    expect(result.reading).toBe("チョウカイカイサイ");
  });

  test("addUserWords applies globally until cleared", async () => {
    addUserWords({ 超会場祭: "チョウカイカイサイ" });
    expect(await isGomamayo("超会場祭")).toBe(true);

    clearUserWords();
    expect(await isGomamayo("超会場祭")).toBe(false);
  });

  test("userDict overrides reading of a known single token", async () => {
    const result = await analyze("会場", { userDict: { 会場: "かいば" } });
    expect(result.reading).toBe("カイバ");
  });

  test("rejects non-kana readings", async () => {
    await expect(
      analyze("会場", { userDict: { 会場: "kaijo" } }),
    ).rejects.toThrow(/かな表記/);
  });
});

describe("find", () => {
  test("returns matches for ゴママヨ", async () => {
    const matches = await find("ごまマヨネーズ");
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThan(0);
  });

  test("returns null for non-ゴママヨ", async () => {
    const matches = await find("パパイヤ");
    expect(matches).toBeNull();
  });
});
