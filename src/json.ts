import type { styleText } from "node:util";

export type Style = Parameters<typeof styleText>[0];
export type Paint = (style: Style, text: string) => string;

/** JSON.stringify(value, null, 2) と同じ形で、jq 風に色を付けて文字列化する */
export function stringifyJson(value: unknown, paint: Paint, indent = ""): string {
  const punct = (text: string) => paint("dim", text);

  if (value === null) return paint("dim", "null");
  if (typeof value === "string") return paint("green", JSON.stringify(value));
  if (typeof value !== "object") return JSON.stringify(value);

  const inner = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return punct("[]");
    const items = value.map((item) => `${inner}${stringifyJson(item, paint, inner)}`);
    return `${punct("[")}\n${items.join(`${punct(",")}\n`)}\n${indent}${punct("]")}`;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return punct("{}");
  const items = entries.map(
    ([key, item]) =>
      `${inner}${paint(["bold", "blue"], JSON.stringify(key))}${punct(":")} ${stringifyJson(item, paint, inner)}`,
  );
  return `${punct("{")}\n${items.join(`${punct(",")}\n`)}\n${indent}${punct("}")}`;
}
