"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Subscription, Summary, SubscriptionType } from "@/types";

export interface SubscriptionPayload {
  name: string;
  amount: number;
  type: SubscriptionType;
  providerId: string;
  description: string;
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get<Subscription[]>("/api/proxy/subscriptions"),
        api.get<Summary>("/api/proxy/subscriptions/summary"),
      ]);

      if (listRes.success) {
        setSubscriptions(listRes.data);
      } else {
        setError(listRes.message ?? "구독 목록을 불러오지 못했습니다.");
      }

      if (summaryRes.success) {
        setSummary(summaryRes.data);
      } else if (!listRes.success) {
        setError(summaryRes.message ?? "요약 정보를 불러오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const create = async (payload: SubscriptionPayload) => {
    const res = await api.post<Subscription>("/api/proxy/subscriptions", payload);
    if (!res.success) throw new Error(res.message ?? "생성 실패");
    await fetchAll();
  };

  const update = async (id: string, payload: SubscriptionPayload) => {
    const res = await api.put<Subscription>(`/api/proxy/subscriptions/${id}`, payload);
    if (!res.success) throw new Error(res.message ?? "수정 실패");
    await fetchAll();
  };

  const remove = async (id: string) => {
    const res = await api.delete(`/api/proxy/subscriptions/${id}`);
    if (!res.success) throw new Error(res.message ?? "삭제 실패");
    await fetchAll();
  };

  return { subscriptions, summary, loading, error, create, update, remove };
}
