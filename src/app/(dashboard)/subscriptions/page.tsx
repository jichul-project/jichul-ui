"use client";

import React, { useMemo, useState } from "react";
import { useSubscriptions, type SubscriptionPayload } from "@/hooks/useSubscriptions";
import { useProviders } from "@/hooks/useProviders";
import Modal from "@/components/ui/Modal";
import type { Subscription } from "@/types";
import styles from "./page.module.css";
import f from "@/components/ui/form.module.css";

const TYPE_LABEL: Record<string, string> = {
  MONTHLY: "월결제",
  YEARLY: "년결제",
};

function fmt(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

const PALETTE = [
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#f59e0b",
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f98016",
];

function getMonthlyAmount(item: Subscription) {
  return item.type === "MONTHLY" ? item.amount : Math.round(item.amount / 12);
}

function buildProviderColorMap(subscriptions: Subscription[]) {
  const totals = new Map<string, number>();

  subscriptions.forEach((item) => {
    const monthly = getMonthlyAmount(item);
    totals.set(item.providerName, (totals.get(item.providerName) ?? 0) + monthly);
  });

  const sortedProviders = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([providerName]) => providerName);

  return new Map(
    sortedProviders.map((providerName, index) => [
      providerName,
      PALETTE[index % PALETTE.length],
    ])
  );
}

function ProviderShareCard({ subscriptions }: { subscriptions: Subscription[] }) {
  const providerColorMap = useMemo(() => buildProviderColorMap(subscriptions), [subscriptions]);

  const rows = useMemo(() => {
    const map: Record<string, number> = {};

    subscriptions.forEach((item) => {
      const monthly = getMonthlyAmount(item);
      map[item.providerName] = (map[item.providerName] ?? 0) + monthly;
    });

    const total = Object.values(map).reduce((sum, value) => sum + value, 0);

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        pct: total === 0 ? 0 : Math.round((value / total) * 100),
        color: providerColorMap.get(name) ?? PALETTE[0],
      }))
      .filter((row) => row.pct > 0);
  }, [subscriptions, providerColorMap]);

  const monthlyTotal = useMemo(
    () => subscriptions.reduce((sum, item) => sum + getMonthlyAmount(item), 0),
    [subscriptions]
  );

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <p className={styles.chartTitle}>제공사별 월 지출 비중</p>
      </div>

      <div className={styles.providerList}>
        {rows.map((row) => (
          <div key={row.name} className={styles.providerRow}>
            <div className={styles.providerLeft}>
              <span className={styles.legendDot} style={{ background: row.color }} />
              <span className={styles.providerName} title={row.name}>
                {row.name}
              </span>
            </div>
            <span className={styles.providerPct}>{row.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ subscriptions }: { subscriptions: Subscription[] }) {
  const providerColorMap = useMemo(() => buildProviderColorMap(subscriptions), [subscriptions]);

  const bars = useMemo(() => {
    const sorted = [...subscriptions]
      .map((item) => ({
        id: item.id,
        name: item.name,
        providerName: item.providerName,
        monthly: getMonthlyAmount(item),
      }))
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 10);

    const max = sorted[0]?.monthly ?? 1;

    return sorted.map((item) => ({
      ...item,
      pct: (item.monthly / max) * 100,
      color: providerColorMap.get(item.providerName) ?? PALETTE[0],
    }));
  }, [subscriptions, providerColorMap]);

  return (
    <div className={styles.chartCard}>
      <p className={styles.chartTitle}>구독별 월 지출 순위 Top 10</p>

      <div className={styles.barList}>
        {bars.map((bar) => (
          <div key={bar.id} className={styles.barRow}>
            <span className={styles.barLabel} title={bar.name}>
              {bar.name}
            </span>

            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${bar.pct}%`, background: bar.color }}
              />
            </div>

            <span className={styles.barAmt}>{fmt(bar.monthly)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type SortKey = "name" | "providerName" | "amount" | "type";
type SortDir = "asc" | "desc";

const EMPTY_FORM: SubscriptionPayload = {
  name: "",
  amount: 0,
  type: "MONTHLY",
  providerId: "",
  description: "",
};

export default function SubscriptionsPage() {
  const { subscriptions, summary, loading, error, create, update, remove } = useSubscriptions();
  const { providers } = useProviders();

  const [modal, setModal] = useState<{ mode: "create" | "edit"; sub?: Subscription } | null>(null);
  const [form, setForm] = useState<SubscriptionPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function setField<K extends keyof SubscriptionPayload>(key: K, val: SubscriptionPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      let cmp = 0;

      if (sortKey === "amount") cmp = a.amount - b.amount;
      else if (sortKey === "type") cmp = a.type.localeCompare(b.type);
      else cmp = (a[sortKey] as string).localeCompare(b[sortKey] as string);

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [subscriptions, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className={styles.sortNone}>↕</span>;
    return <span className={styles.sortActive}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setModal({ mode: "create" });
  }

  function openEdit(sub: Subscription) {
    setForm({
      name: sub.name,
      amount: sub.amount,
      type: sub.type,
      providerId: sub.providerId,
      description: sub.description ?? "",
    });
    setFormError("");
    setModal({ mode: "edit", sub });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.providerId || !form.amount) return;

    setFormError("");
    setSubmitting(true);

    try {
      const payload = { ...form, amount: Number(form.amount) };

      if (modal?.mode === "edit" && modal.sub) {
        await update(modal.sub.id, payload);
      } else {
        await create(payload);
      }

      setModal(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sub: Subscription) {
    if (!confirm(`"${sub.name}"을 삭제할까요?`)) return;

    try {
      await remove(sub.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  const valid = form.name.trim() && form.providerId && Number(form.amount) > 0;
  const hasData = !loading && subscriptions.length > 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>구독 목록</h1>
          <p className={styles.subtitle}>등록된 구독 서비스를 관리합니다.</p>
        </div>

        <button className={styles.btnAdd} onClick={openCreate}>
          + 구독 추가
        </button>
      </div>

      {summary && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>월 총 지출</span>
            <span className={styles.summaryValue}>{fmt(Math.round(summary.monthlyTotal))}</span>
            <span className={styles.summarySub}>년결제 월 환산 포함</span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>연 총 지출</span>
            <span className={styles.summaryValue}>{fmt(Math.round(summary.yearlyTotal))}</span>
            <span className={styles.summarySub}>월결제 × 12 포함</span>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>구독 수</span>
            <span className={styles.summaryValue}>{summary.totalCount}개</span>
            <span className={styles.summarySub}>
              월결제 {summary.monthlyCount} · 년결제 {summary.yearlyCount}
            </span>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {hasData && (
        <div className={styles.chartGrid}>
          <ProviderShareCard subscriptions={subscriptions} />
          <BarChart subscriptions={subscriptions} />
        </div>
      )}

      <div className={styles.section}>
        {loading ? (
          <div className={styles.skeletonWrap}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>등록된 구독이 없습니다</p>
            <p className={styles.emptyDesc}>구독 추가 버튼을 눌러 첫 번째 구독을 등록해 보세요.</p>
            <button className={styles.emptyBtn} onClick={openCreate}>
              + 구독 추가
            </button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
              <tr>
                <th onClick={() => handleSort("name")} className={styles.sortable}>
                  서비스 <SortIcon col="name" />
                </th>
                <th onClick={() => handleSort("providerName")} className={styles.sortable}>
                  제공사 <SortIcon col="providerName" />
                </th>
                <th onClick={() => handleSort("amount")} className={styles.sortable}>
                  금액 <SortIcon col="amount" />
                </th>
                <th onClick={() => handleSort("type")} className={styles.sortable}>
                  타입 <SortIcon col="type" />
                </th>
                <th>설명</th>
                <th></th>
              </tr>
              </thead>

              <tbody>
              {sorted.map((sub) => {
                const monthlyEquiv = sub.type === "YEARLY" ? Math.round(sub.amount / 12) : null;

                return (
                  <tr key={sub.id}>
                    <td>
                      <div className={styles.nameCell}>
                          <span className={styles.nameTxt} title={sub.name}>
                            {sub.name}
                          </span>
                      </div>
                    </td>

                    <td className={styles.providerCell}>{sub.providerName}</td>

                    <td>
                      <div className={styles.amountCell}>
                        <span className={styles.amountMain}>{fmt(sub.amount)}</span>
                        {monthlyEquiv && <span className={styles.amountSub}>월 {fmt(monthlyEquiv)}</span>}
                      </div>
                    </td>

                    <td>
                        <span
                          className={`${styles.badge} ${
                            sub.type === "MONTHLY" ? styles.monthly : styles.yearly
                          }`}
                        >
                          {TYPE_LABEL[sub.type]}
                        </span>
                    </td>

                    <td className={styles.descCell}>
                      {sub.description ? (
                        <span title={sub.description}>{sub.description}</span>
                      ) : (
                        <span className={styles.nil}>—</span>
                      )}
                    </td>

                    <td className={styles.actionsCell}>
                      <button className={styles.btnEdit} onClick={() => openEdit(sub)}>
                        수정
                      </button>
                      <button className={styles.btnDel} onClick={() => handleDelete(sub)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === "create" ? "구독 추가" : "구독 수정"} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className={f.form}>
            {formError && <p className={f.error}>{formError}</p>}

            <div className={f.field}>
              <label className={f.label}>서비스 이름</label>
              <input
                className={f.input}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="예: Netflix 프리미엄"
                required
                autoFocus
                maxLength={200}
              />
            </div>

            <div className={f.row}>
              <div className={f.field}>
                <label className={f.label}>금액 (원)</label>
                <input
                  type="number"
                  className={f.input}
                  value={form.amount || ""}
                  min={1}
                  onChange={(e) => setField("amount", Number(e.target.value))}
                  placeholder="13500"
                  required
                />
              </div>

              <div className={f.field}>
                <label className={f.label}>결제 타입</label>
                <select
                  className={f.select}
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value as "MONTHLY" | "YEARLY")}
                >
                  <option value="MONTHLY">월결제</option>
                  <option value="YEARLY">년결제</option>
                </select>
              </div>
            </div>

            <div className={f.field}>
              <label className={f.label}>제공사</label>
              <select
                className={f.select}
                value={form.providerId}
                onChange={(e) => setField("providerId", e.target.value)}
                required
              >
                <option value="">제공사 선택</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={f.field}>
              <label className={f.label}>설명 (선택)</label>
              <textarea
                className={f.textarea}
                value={form.description}
                maxLength={500}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="추가 설명을 입력하세요"
              />
            </div>

            <div className={f.actions}>
              <button type="button" className={f.btnCancel} onClick={() => setModal(null)}>
                취소
              </button>
              <button type="submit" className={f.btnSubmit} disabled={submitting || !valid}>
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
