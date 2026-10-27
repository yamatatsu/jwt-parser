#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { formatJson, formatPretty } from "./format.ts";
import { decodeJwt, JwtParseError } from "./jwt.ts";
import { extractTimes } from "./time.ts";

const HELP = `Usage: jwt-parse [options] [token]

JWT をデコードして header / payload を表示します (署名は検証しません)。
token を省略すると標準入力から読み込みます。"Bearer " 接頭辞は自動で取り除きます。

Options:
  -j, --json      JSON で出力する
      --no-color  色を付けない (NO_COLOR 環境変数でも可)
  -h, --help      このヘルプを表示する

Examples:
  jwt-parse eyJhbGciOi...
  pbpaste | jwt-parse
  jwt-parse --json "$TOKEN" | jq .payload`;

function readStdin(): string {
  if (process.stdin.isTTY) return "";
  return readFileSync(process.stdin.fd, "utf8");
}

function shouldColor(noColorFlag: boolean): boolean {
  if (noColorFlag || "NO_COLOR" in process.env) return false;
  if ("FORCE_COLOR" in process.env) return true;
  return process.stdout.isTTY === true;
}

function main(argv: string[]): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        json: { type: "boolean", short: "j", default: false },
        color: { type: "boolean", default: true },
        help: { type: "boolean", short: "h", default: false },
      },
      allowNegative: true,
    });
  } catch (error) {
    console.error(`error: ${(error as Error).message}\n\n${HELP}`);
    return 2;
  }
  const { values, positionals } = parsed;

  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (positionals.length > 1) {
    console.error("error: token は 1 つだけ指定してください");
    return 2;
  }

  const input = positionals[0] ?? readStdin();
  if (input.trim() === "") {
    console.error(`error: token が指定されていません\n\n${HELP}`);
    return 2;
  }

  try {
    const decoded = decodeJwt(input);
    const times = extractTimes(decoded.payload);
    const options = { color: shouldColor(!values.color) };
    console.log(
      values.json ? formatJson(decoded, times, options) : formatPretty(decoded, times, options),
    );
    return 0;
  } catch (error) {
    if (error instanceof JwtParseError) {
      console.error(`error: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

process.exitCode = main(process.argv.slice(2));
