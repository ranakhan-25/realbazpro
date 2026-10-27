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
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEYS.accessToken);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEYS.refreshToken);
}

export function getStoredUserProfile(): AdminUserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEYS.userProfile);
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
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEYS.accessToken,
      accessToken,
    );
    // Also synchronize shared access_token key for axios interceptors
    window.localStorage.setItem("access_token", accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEYS.refreshToken,
      refreshToken,
    );
  }

  if (userProfile) {
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEYS.userProfile,
      JSON.stringify(userProfile),
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

  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEYS.accessToken);
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEYS.refreshToken);
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEYS.userProfile);
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("realbiz-session");
}

export const adminAuthStorage = {
  getAccessToken: getStoredAccessToken,
  getRefreshToken: getStoredRefreshToken,
  getUserProfile: getStoredUserProfile,
  setTokens: setStoredTokens,
  clear: clearStoredTokens,
};
