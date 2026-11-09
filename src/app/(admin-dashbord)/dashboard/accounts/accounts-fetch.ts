import { adminAuthStorage } from "@/lib/admin-auth/adminAuthStorage";
import { refreshAdminSession } from "@/lib/admin-auth/adminAuthApi";

/** Attach the logged-in admin token to Accounts API calls. */
export async function accountsFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  if (typeof window === "undefined") return fetch(input, init);

  const getToken = () =>
    adminAuthStorage.getAccessToken() ||
    window.localStorage.getItem("admin_access_token") ||
    window.localStorage.getItem("access_token") ||
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken");

  const makeInit = (token: string | null) => {
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (/^Bearer\s+(null|undefined)$/i.test(headers.get("Authorization") || "")) {
      headers.delete("Authorization");
    }

    return { ...init, headers };
  };

  const response = await fetch(input, makeInit(getToken()));
  if (response.status !== 401) return response;

  // Native fetch does not use the Axios client's automatic token refresh.
  const session = await refreshAdminSession();
  if (!session?.accessToken) return response;

  adminAuthStorage.setTokens(session.accessToken, session.refreshToken);
  return fetch(input, makeInit(session.accessToken));
}
