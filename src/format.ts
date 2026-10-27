import { styleText } from "node:util";
import { stringifyJson, type Paint, type Style } from "./json.ts";
import type { DecodedJwt } from "./jwt.ts";
import type { TimeInfo, TimeStatus } from "./time.ts";

export interface FormatOptions {
  color: boolean;
}

const STATUS_TEXT: Record<TimeStatus, [string, Style]> = {
  valid: ["有効", "green"],
  expired: ["期限切れ", "red"],
  not_yet_valid: ["未到来", "yellow"],
};

function createPaint(options: FormatOptions): Paint {
  return (style, text) =>
    options.color ? styleText(style, text, { validateStream: false }) : text;
}

export function formatJson(decoded: DecodedJwt, times: TimeInfo[], options: FormatOptions): string {
  return stringifyJson({ ...decoded, times }, createPaint(options));
}

export function formatPretty(
  decoded: DecodedJwt,
  times: TimeInfo[],
  options: FormatOptions,
): string {
  const paint = createPaint(options);
  const heading = (text: string) => paint(["bold", "cyan"], text);
  const json = (value: unknown) =>
    typeof value === "string" ? value : stringifyJson(value, paint);

  const lines: string[] = [];
  lines.push(heading("Header"), json(decoded.header), "");
  lines.push(heading("Payload"), json(decoded.payload), "");

  if (times.length > 0) {
    lines.push(heading("Times"));
    const claimWidth = Math.max(...times.map((t) => t.claim.length));
    const indent = " ".repeat(claimWidth + 4);
    for (const t of times) {
      const status = t.status
        ? ` ${paint(STATUS_TEXT[t.status][1], STATUS_TEXT[t.status][0])}`
        : "";
      lines.push(
        `  ${paint("bold", t.claim.padEnd(claimWidth))}  ${t.label}  ${paint("dim", String(t.value))}${status} ${paint("dim", `(${t.relative})`)}`,
        `${indent}${paint("dim", "JST")} ${t.jst}`,
        `${indent}${paint("dim", "UTC")} ${t.utc}`,
      );
    }
    lines.push("");
  }

  lines.push(heading("Signature"), `${decoded.signature} ${paint("dim", "(未検証)")}`);
  return lines.join("\n");
}
