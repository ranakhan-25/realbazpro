import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

export interface AdminUserProfile {
  id?: number;
  uuid?: string;
  name: string;
  email: string;
  username?: string;
  role?: string;
  roles?: string[];
  isSuperUser?: boolean;
  isOrgAdmin?: boolean;
  orgId?: number | null;
  orgUuid?: string | null;
  orgName?: string | null;
}

export const ADMIN_AUTH_STORAGE_KEYS = {
  accessToken: "admin_access_token",
  refreshToken: "admin_refresh_token",
  userProfile: "admin_user_profile",
};

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  // Primary: Read from cookies
  const cookieToken =
    getCookie(ADMIN_AUTH_STORAGE_KEYS.accessToken) ||
    getCookie("access_token") ||
    getCookie("token");
  if (cookieToken) return cookieToken;

  // Fallback: Read from localStorage
  return (
    window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEYS.accessToken) ||
    window.localStorage.getItem("access_token") ||
    window.localStorage.getItem("token")
  );
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  // Primary: Read from cookies
  const cookieRefresh =
    getCookie(ADMIN_AUTH_STORAGE_KEYS.refreshToken) ||
    getCookie("refresh_token") ||
    getCookie("refreshToken");
  if (cookieRefresh) return cookieRefresh;

  // Fallback: Read from localStorage
  return (
    window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEYS.refreshToken) ||
    window.localStorage.getItem("refreshToken")
  );
}

export function getStoredUserProfile(): AdminUserProfile | null {
  if (typeof window === "undefined") return null;
  const raw =
    getCookie(ADMIN_AUTH_STORAGE_KEYS.userProfile) ||
    window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEYS.userProfile);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUserProfile;
  } catch {
    return null;
  }
}

export function setStoredTokens(
  accessToken?: string,
  refreshToken?: string,
  userProfile?: AdminUserProfile,
) {
  if (typeof window === "undefined") return;

  if (accessToken) {
    // Store in Cookies (7 days expiry, root path)
    setCookie(ADMIN_AUTH_STORAGE_KEYS.accessToken, accessToken, { days: 7 });
    setCookie("access_token", accessToken, { days: 7 });
    setCookie("token", accessToken, { days: 7 });

    // Also mirror to localStorage for legacy consumers
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEYS.accessToken,
      accessToken,
    );
    window.localStorage.setItem("access_token", accessToken);
  }

  if (refreshToken) {
    // Store in Cookies (30 days expiry)
    setCookie(ADMIN_AUTH_STORAGE_KEYS.refreshToken, refreshToken, { days: 30 });
    setCookie("refresh_token", refreshToken, { days: 30 });

    // Also mirror to localStorage
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEYS.refreshToken,
      refreshToken,
    );
  }

  if (userProfile) {
    const profileJson = JSON.stringify(userProfile);
    setCookie(ADMIN_AUTH_STORAGE_KEYS.userProfile, profileJson, { days: 7 });

    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEYS.userProfile,
      profileJson,
    );
    window.localStorage.setItem(
      "realbiz-session",
      JSON.stringify({
        name: userProfile.name || userProfile.username || "User",
        email: userProfile.email || "",
      }),
    );
  }
}

export function clearStoredTokens() {
  if (typeof window === "undefined") return;

  // Remove cookies
  removeCookie(ADMIN_AUTH_STORAGE_KEYS.accessToken);
  removeCookie("access_token");
  removeCookie("token");
  removeCookie(ADMIN_AUTH_STORAGE_KEYS.refreshToken);
  removeCookie("refresh_token");
  removeCookie(ADMIN_AUTH_STORAGE_KEYS.userProfile);

  // Clear localStorage
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEYS.accessToken);
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEYS.refreshToken);
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEYS.userProfile);
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("realbiz-session");
}

export const adminAuthStorage = {
  getAccessToken: getStoredAccessToken,
  getRefreshToken: getStoredRefreshToken,
  getUserProfile: getStoredUserProfile,
  setTokens: setStoredTokens,
  clear: clearStoredTokens,
};
