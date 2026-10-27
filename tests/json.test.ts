import { stripVTControlCharacters, styleText } from "node:util";
import { expect, test } from "vite-plus/test";
import { stringifyJson, type Paint } from "../src/json.ts";

const plain: Paint = (_style, text) => text;
const colored: Paint = (style, text) => styleText(style, text, { validateStream: false });

const SAMPLE = {
  sub: "user-1",
  iat: 1516239022,
  admin: true,
  nickname: null,
  groups: ["a", { nested: [] }],
  empty: {},
  quote: 'say "hi"\n',
};

test("色なしでは JSON.stringify(value, null, 2) と一致する", () => {
  for (const value of [SAMPLE, [], {}, "x", 1, null, [1, [2, []]]]) {
    expect(stringifyJson(value, plain)).toBe(JSON.stringify(value, null, 2));
  }
});

test("色付きでも制御文字を除けば JSON として同じ", () => {
  const out = stringifyJson(SAMPLE, colored);
  expect(out).not.toBe(stripVTControlCharacters(out));
  expect(stripVTControlCharacters(out)).toBe(JSON.stringify(SAMPLE, null, 2));
});

test("キー・文字列・null に jq 風の色を付ける", () => {
  const out = stringifyJson({ k: "v", n: null, x: 1 }, colored);
  expect(out).toContain(styleText(["bold", "blue"], '"k"', { validateStream: false }));
  expect(out).toContain(styleText("green", '"v"', { validateStream: false }));
  expect(out).toContain(styleText("dim", "null", { validateStream: false }));
  expect(out).toContain(" 1\n");
});
