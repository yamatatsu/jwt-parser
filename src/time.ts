export const TIME_CLAIMS = {
  iat: "発行日時",
  nbf: "有効開始",
  exp: "有効期限",
  auth_time: "認証日時",
} as const;

export type TimeClaim = keyof typeof TIME_CLAIMS;
export type TimeStatus = "valid" | "expired" | "not_yet_valid";

export interface TimeInfo {
  claim: TimeClaim;
  label: string;
  value: number;
  utc: string;
  jst: string;
  relative: string;
  status?: TimeStatus;
}

const jstFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const relativeFormatter = new Intl.RelativeTimeFormat("ja", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
];

/** ISO 8601 (UTC)。例: 2018-01-18T01:30:22Z */
export function toUtc(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/** ISO 8601 (JST)。例: 2018-01-18T10:30:22+09:00 */
export function toJst(date: Date): string {
  return `${jstFormatter.format(date).replace(" ", "T")}+09:00`;
}

export function toRelative(diffSeconds: number): string {
  const abs = Math.abs(diffSeconds);
  const [unit, size] = UNITS.find(([, size]) => abs >= size) ?? ["second", 1];
  return relativeFormatter.format(Math.trunc(diffSeconds / size), unit);
}

function statusOf(claim: TimeClaim, value: number, nowSeconds: number): TimeStatus | undefined {
  if (claim === "exp") return value <= nowSeconds ? "expired" : "valid";
  if (claim === "nbf") return value > nowSeconds ? "not_yet_valid" : "valid";
  return undefined;
}

export function extractTimes(payload: unknown, now: Date = new Date()): TimeInfo[] {
  if (typeof payload !== "object" || payload === null) return [];
  const nowSeconds = now.getTime() / 1000;
  const infos: TimeInfo[] = [];
  for (const [claim, label] of Object.entries(TIME_CLAIMS) as [TimeClaim, string][]) {
    const value = (payload as Record<string, unknown>)[claim];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) continue;
    const status = statusOf(claim, value, nowSeconds);
    infos.push({
      claim,
      label,
      value,
      utc: toUtc(date),
      jst: toJst(date),
      relative: toRelative(value - nowSeconds),
      ...(status && { status }),
    });
  }
  return infos;
}
