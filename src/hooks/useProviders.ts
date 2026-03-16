"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Provider } from "@/types";

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get<Provider[]>("/api/proxy/providers");

      if (res.success) {
        setProviders(res.data);
      } else {
        setError(res.message ?? "불러오기 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProviders();
  }, [fetchProviders]);

  const create = async (name: string) => {
    const res = await api.post<Provider>("/api/proxy/providers", { name });
    if (!res.success) throw new Error(res.message ?? "생성 실패");
    setProviders((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const update = async (id: string, name: string) => {
    const res = await api.put<Provider>(`/api/proxy/providers/${id}`, { name });
    if (!res.success) throw new Error(res.message ?? "수정 실패");
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? res.data : p)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const remove = async (id: string) => {
    const res = await api.delete(`/api/proxy/providers/${id}`);
    if (!res.success) throw new Error(res.message ?? "삭제 실패");
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
    create,
    update,
    remove,
  };
}
