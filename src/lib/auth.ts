import { api, saveTokens, clearTokens } from "./api";
import type { LoginResponse } from "@/types";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>("/api/auth/login", { email, password });
  if (!res.success || !res.data) throw new Error(res.message ?? "로그인 실패");
  saveTokens(res.data.accessToken, res.data.refreshToken);
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify({
      id: res.data.userId,
      email: res.data.email,
      name: res.data.name,
    }));
  }
  return res.data;
}

export async function logout() {
  try {
    await api.post("/api/auth/logout", {});
  } finally {
    clearTokens();
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }
}

export function getStoredUser(): { id: string; email: string; name: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
