"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Provider } from "@/types";

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Provider[]>("/api/providers");
      if (res.success) setProviders(res.data);
      else setError(res.message ?? "불러오기 실패");
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (name: string) => {
    const res = await api.post<Provider>("/api/providers", { name });
    if (!res.success) throw new Error(res.message ?? "생성 실패");
    setProviders((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const update = async (id: string, name: string) => {
    const res = await api.put<Provider>(`/api/providers/${id}`, { name });
    if (!res.success) throw new Error(res.message ?? "수정 실패");
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? res.data : p)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const remove = async (id: string) => {
    const res = await api.delete(`/api/providers/${id}`);
    if (!res.success) throw new Error(res.message ?? "삭제 실패");
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  return { providers, loading, error, refetch: fetch, create, update, remove };
}
