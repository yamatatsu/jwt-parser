import { describe, expect, test } from "vite-plus/test";
import { decodeJwt, JwtParseError, normalizeToken } from "../src/jwt.ts";

// jwt.io のサンプルトークン
const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt", () => {
  test("header と payload をデコードする", () => {
    expect(decodeJwt(SAMPLE)).toEqual({
      header: { alg: "HS256", typ: "JWT" },
      payload: { sub: "1234567890", name: "John Doe", iat: 1516239022 },
      signature: "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    });
  });

  test("Bearer 接頭辞と前後の空白を取り除く", () => {
    expect(decodeJwt(`  Bearer ${SAMPLE}\n`).header).toEqual({ alg: "HS256", typ: "JWT" });
  });

  test("JSON でない payload は文字列で返す", () => {
    const payload = Buffer.from("hello").toString("base64url");
    expect(decodeJwt(`eyJhbGciOiJub25lIn0.${payload}.`).payload).toBe("hello");
  });

  test.each([
    ["abc", "3 セグメント"],
    ["a.b.c.d.e", "JWE"],
    ["!!!.e30.", "header が base64url"],
    ["bm90anNvbg.e30.", "header が JSON ではありません"],
    ["WzFd.e30.", "JSON オブジェクトではありません"],
    ["e30.e30.a+b", "signature"],
  ])("%s は不正", (token, message) => {
    expect(() => decodeJwt(token)).toThrow(JwtParseError);
    expect(() => decodeJwt(token)).toThrow(message);
  });
});

test("normalizeToken", () => {
  expect(normalizeToken("bearer  x.y.z ")).toBe("x.y.z");
});

test.each([
  ['"x.y.z"', "x.y.z"],
  [' "x.y.z"\n', "x.y.z"],
  ['"Bearer x.y.z"', "x.y.z"],
  ['"x.y.z', "x.y.z"],
  ['x.y.z"', "x.y.z"],
])('normalizeToken は前後の " を取り除く: %j', (input, expected) => {
  expect(normalizeToken(input)).toBe(expected);
});
