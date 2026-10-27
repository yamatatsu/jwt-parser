import { expect, test } from "vite-plus/test";
import { extractTimes, toJst, toRelative, toUtc } from "../src/time.ts";

const NOW = new Date("2026-10-27T03:00:00Z");
const now = NOW.getTime() / 1000;

test("UTC / JST の表記", () => {
  const date = new Date(1516239022 * 1000);
  expect(toUtc(date)).toBe("2018-01-18T01:30:22Z");
  expect(toJst(date)).toBe("2018-01-18T10:30:22+09:00");
});

test("JST で日付が変わる", () => {
  expect(toJst(new Date("2026-10-27T15:00:00Z"))).toBe("2026-10-28T00:00:00+09:00");
});

test("相対時間", () => {
  expect(toRelative(-3 * 3600)).toBe("3 時間前");
  expect(toRelative(90)).toBe("1 分後");
  expect(toRelative(0)).toBe("今");
  expect(toRelative(-400 * 86400)).toBe("昨年");
});

test("exp / nbf の状態を判定する", () => {
  const times = extractTimes({ iat: now - 60, nbf: now + 60, exp: now - 1 }, NOW);
  expect(times.map((t) => [t.claim, t.status])).toEqual([
    ["iat", undefined],
    ["nbf", "not_yet_valid"],
    ["exp", "expired"],
  ]);
  expect(extractTimes({ exp: now + 3600, nbf: now }, NOW).map((t) => t.status)).toEqual([
    "valid",
    "valid",
  ]);
});

test("数値でない時刻クレームは無視する", () => {
  expect(extractTimes({ exp: "1516239022", iat: null }, NOW)).toEqual([]);
  expect(extractTimes("not object", NOW)).toEqual([]);
});
