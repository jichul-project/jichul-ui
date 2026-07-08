"use client";

import {useCallback, useEffect, useState} from "react";
import {api} from "@/lib/api";
import {ExchangeRate} from "@/types";

const ONE_HOUR_MS = 1000 * 60 * 60;

export function useExchangeRate() {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError("");

    try {
      const [exchangeRateRes] = await Promise.all([
        api.get<ExchangeRate>("/api/proxy/exchange-rate"),
      ]);

      if (exchangeRateRes.success) {
        setExchangeRate(exchangeRateRes.data);
      } else {
        setError(exchangeRateRes.message ?? "환율 정보를 불러오지 못했습니다.");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchAll(false);

    const intervalId = setInterval(() => {
      void fetchAll(true);
    }, ONE_HOUR_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchAll]);

  return {exchangeRate, loading, error};
}
