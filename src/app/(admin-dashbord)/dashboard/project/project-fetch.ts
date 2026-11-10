import { adminAuthStorage } from "@/lib/admin-auth/adminAuthStorage";
import api from "@/lib/api";

const CP1252_BYTES: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x2c6: 0x88, 0x2030: 0x89, 0x160: 0x8a,
  0x2039: 0x8b, 0x152: 0x8c, 0x17d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x2dc: 0x98, 0x2122: 0x99, 0x161: 0x9a, 0x203a: 0x9b, 0x153: 0x9c,
  0x17e: 0x9e, 0x178: 0x9f,
};

function decodeMojibakeLayer(value: string): string | null {
  const bytes = Array.from(value, (character) => {
    const codePoint = character.codePointAt(0)!;
    if (codePoint <= 0xff) return codePoint;
    return CP1252_BYTES[codePoint] ?? null;
  });
  if (bytes.some((byte) => byte === null)) return null;
  try {
    return decodeURIComponent(bytes.map((byte) => "%" + byte!.toString(16).padStart(2, "0")).join(""));
  } catch {
    return null;
  }
}

function mojibakeScore(value: string): number {
  return (value.match(/[\u00c3\u00c2\u00e2\u00f0\u0192]/g) || []).length;
}

export function normalizeProjectText(value: unknown): string {
  let result = value == null ? "" : String(value);
  for (let attempt = 0; attempt < 4 && mojibakeScore(result) > 0; attempt += 1) {
    const decoded = decodeMojibakeLayer(result);
    if (!decoded || mojibakeScore(decoded) >= mojibakeScore(result)) break;
    result = decoded;
  }
  return result;
}

export async function projectFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  if (typeof window === "undefined") return fetch(input, init);
  const inputUrl = input instanceof Request ? input.url : input instanceof URL ? input.href : input;
  const requestUrl = new URL(inputUrl, window.location.href);
  const apiPrefix = "/realbizpro/api/v1";
  const apiPrefixIndex = requestUrl.pathname.indexOf(apiPrefix);
  if (apiPrefixIndex < 0) return fetch(input, init);

  const token = adminAuthStorage.getAccessToken();
  if (!token) return fetch(input, init);

  const configuredBase = new URL(api.defaults.baseURL || apiPrefix, window.location.href);
  const configuredPath = configuredBase.pathname.replace(/\/+$/, "");
  const apiBase = configuredPath.endsWith(apiPrefix) ? configuredPath : configuredPath + apiPrefix;
  const endpointPath = requestUrl.pathname.slice(apiPrefixIndex + apiPrefix.length);
  const targetUrl = new URL(apiBase + endpointPath + requestUrl.search + requestUrl.hash, configuredBase.origin);
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  headers.set("Authorization", "Bearer " + token);
  return fetch(targetUrl, { ...init, headers });
}
