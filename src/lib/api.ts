import type { ApiResponse } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  // 미들웨어(서버)에서 읽을 수 있도록 쿠키에도 저장
  // max-age=604800 → 리프레시 토큰 만료(7일)와 동기화
  // proxy.ts에서 로그인 여부 판단용이므로 리프레시 토큰 기준으로 설정
  document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Strict`;
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  document.cookie = "accessToken=; path=/; max-age=0; SameSite=Strict";
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const json: ApiResponse<{ accessToken: string; refreshToken: string }> =
      await res.json();

    if (!json.success) {
      clearTokens();
      return null;
    }

    saveTokens(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // 401 → 토큰 갱신 후 1회 재시도
  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, false);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  const json: ApiResponse<T> = await res.json();
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
