import { adminAuthStorage } from "@/lib/admin-auth/adminAuthStorage";

/** Fetch HRM API data with the same admin token used by the authenticated UI. */
export async function hrmFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  if (typeof window === "undefined") return fetch(input, init);

  const token =
    window.localStorage.getItem("admin_access_token") ||
    window.localStorage.getItem("access_token") ||
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    adminAuthStorage.getAccessToken();
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (/^Bearer\s+(null|undefined)$/i.test(headers.get("Authorization") || "")) {
    headers.delete("Authorization");
  }

  return fetch(input, { ...init, headers });
}
