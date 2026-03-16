import type {ApiResponse} from "@/types";

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    return res.ok;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return request<T>(path, options, false);
    }

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    throw new Error("인증이 만료되었습니다.");
  }

  return (await res.json()) as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE",
    }),
};
