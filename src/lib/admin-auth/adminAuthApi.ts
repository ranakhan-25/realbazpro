import api from "@/lib/api";
import {
  type AdminUserProfile,
  clearStoredTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
} from "./adminAuthStorage";

export interface AdminAuthSession {
  accessToken: string;
  token?: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user?: AdminUserProfile;
}

interface BackendAuthResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user?: AdminUserProfile;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: AdminUserProfile;
  };
}

export async function loginUniversalSession(
  identifier: string,
  password: string,
): Promise<AdminAuthSession> {
  try {
    const response = await api.post<BackendAuthResponse>("/auth/login", {
      username: identifier.trim(),
      password,
    });

    const resData = response.data;
    const accessToken = resData.accessToken || resData.data?.accessToken;
    const refreshToken = resData.refreshToken || resData.data?.refreshToken;
    const user = resData.user || resData.data?.user;

    if (!accessToken) {
      throw new Error("Login failed: Authentication token was not returned by server.");
    }

    const session: AdminAuthSession = {
      accessToken,
      token: accessToken,
      refreshToken: refreshToken || "",
      tokenType: resData.tokenType || "Bearer",
      expiresIn: resData.expiresIn || 3600,
      user: user || {
        name: identifier.split("@")[0],
        email: identifier,
      },
    };

    return session;
  } catch (err: any) {
    if (err.response?.data?.message) {
      const msg = err.response.data.message;
      if (Array.isArray(msg)) {
        throw new Error(msg.join(", "));
      }
      throw new Error(msg);
    }
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error("Login failed. Please verify your credentials and try again.");
  }
}

export async function loginAdminSession(
  identifier: string,
  password: string,
): Promise<AdminAuthSession> {
  try {
    const response = await api.post<BackendAuthResponse>("/auth/login", {
      username: identifier.trim(),
      password,
    });

    const resData = response.data;
    const accessToken = resData.accessToken || resData.data?.accessToken;
    const refreshToken = resData.refreshToken || resData.data?.refreshToken;
    const user = resData.user || resData.data?.user;

    if (!accessToken) {
      throw new Error("Login failed: Authentication token was not returned by server.");
    }

    // Verify administrator privileges
    const isSuperUser = Boolean(user?.isSuperUser);
    const isOrgAdmin = Boolean(user?.isOrgAdmin);
    const hasAdminRole = Array.isArray(user?.roles)
      ? user.roles.some((r) =>
          ["super-admin", "super_admin", "admin"].includes(r.toLowerCase()),
        )
      : false;

    if (!isSuperUser && !isOrgAdmin && !hasAdminRole) {
      throw new Error(
        "Access denied: This portal is restricted to system administrators.",
      );
    }

    const session: AdminAuthSession = {
      accessToken,
      token: accessToken,
      refreshToken: refreshToken || "",
      tokenType: resData.tokenType || "Bearer",
      expiresIn: resData.expiresIn || 3600,
      user: user || {
        name: identifier.split("@")[0],
        email: identifier,
        isSuperUser: true,
      },
    };

    return session;
  } catch (err: any) {
    if (err.response?.data?.message) {
      const msg = err.response.data.message;
      if (Array.isArray(msg)) {
        throw new Error(msg.join(", "));
      }
      throw new Error(msg);
    }
    if (err.message) {
      throw new Error(err.message);
    }
    throw new Error("Admin login failed. Please verify your credentials and try again.");
  }
}

export async function refreshAdminSession(): Promise<AdminAuthSession | null> {
  try {
    const storedRefresh = getStoredRefreshToken();
    if (!storedRefresh) return null;

    const response = await api.post<BackendAuthResponse>("/auth/refresh", {
      refreshToken: storedRefresh,
    });

    const resData = response.data;
    const accessToken = resData.accessToken || resData.data?.accessToken;
    const refreshToken = resData.refreshToken || resData.data?.refreshToken || storedRefresh;
    const user = resData.user || resData.data?.user;

    if (!accessToken) return null;

    return {
      accessToken,
      token: accessToken,
      refreshToken: refreshToken || storedRefresh,
      tokenType: resData.tokenType || "Bearer",
      expiresIn: resData.expiresIn || 3600,
      user: user || {
        name: "Super Admin",
        email: "admin@admin.com",
        isSuperUser: true,
      },
    };
  } catch (err) {
    console.warn("Unable to refresh admin session:", err);
    return null;
  }
}

export async function logoutAdminSession(): Promise<void> {
  try {
    const token = getStoredAccessToken();
    if (token) {
      await api.post(
        "/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    }
  } catch (err) {
    console.warn("Server logout request encountered an issue:", err);
  } finally {
    clearStoredTokens();
  }
}
