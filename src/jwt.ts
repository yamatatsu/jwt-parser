export type JsonObject = Record<string, unknown>;

export interface DecodedJwt {
  header: JsonObject;
  payload: JsonObject | string;
  signature: string;
}

export class JwtParseError extends Error {
  override name = "JwtParseError";
}

const BASE64URL = /^[A-Za-z0-9_-]*$/;

export function normalizeToken(input: string): string {
  // Chrome DevTools からコピーすると前後に " が付いていることがある
  return input
    .trim()
    .replace(/^"|"$/g, "")
    .trim()
    .replace(/^Bearer\s+/i, "");
}

function decodeSegment(segment: string, label: string): string {
  if (!BASE64URL.test(segment)) {
    throw new JwtParseError(`${label} が base64url として不正です`);
  }
  return Buffer.from(segment, "base64url").toString("utf8");
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = normalizeToken(token).split(".");
  if (parts.length === 5) {
    throw new JwtParseError("JWE (5 セグメント) には対応していません");
  }
  if (parts.length !== 3) {
    throw new JwtParseError(`JWT は 3 セグメントである必要があります (実際: ${parts.length})`);
  }
  const [rawHeader, rawPayload, signature] = parts as [string, string, string];

  let header: unknown;
  try {
    header = JSON.parse(decodeSegment(rawHeader, "header"));
  } catch (error) {
    if (error instanceof JwtParseError) throw error;
    throw new JwtParseError("header が JSON ではありません");
  }
  if (!isObject(header)) {
    throw new JwtParseError("header が JSON オブジェクトではありません");
  }

  // JWS の payload は任意のバイト列になり得るので、JSON でなければ文字列のまま返す
  const payloadText = decodeSegment(rawPayload, "payload");
  let payload: JsonObject | string = payloadText;
  try {
    const parsed: unknown = JSON.parse(payloadText);
    if (isObject(parsed)) payload = parsed;
  } catch {}

  if (!BASE64URL.test(signature)) {
    throw new JwtParseError("signature が base64url として不正です");
  }

  return { header, payload, signature };
}
