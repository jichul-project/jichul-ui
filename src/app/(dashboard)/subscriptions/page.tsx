"use client";

import React, { useState, useMemo } from "react";
import { useSubscriptions, type SubscriptionPayload } from "@/hooks/useSubscriptions";
import { useProviders } from "@/hooks/useProviders";
import Modal from "@/components/ui/Modal";
import type { Subscription } from "@/types";
import styles from "./page.module.css";
import f from "@/components/ui/form.module.css";

const TYPE_LABEL: Record<string, string> = { MONTHLY: "월결제", YEARLY: "년결제" };

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
  "#f97316",
];

function colorIdx(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % PALETTE.length;
}

function DonutChart({ subscriptions }: { subscriptions: Subscription[] }) {
  const slices = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((s) => {
      const monthly = s.type === "MONTHLY" ? s.amount : Math.round(s.amount / 12);
      map[s.providerName] = (map[s.providerName] ?? 0) + monthly;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    let cumAngle = -Math.PI / 2;

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => {
        const angle = (val / total) * 2 * Math.PI;
        const start = cumAngle;
        cumAngle += angle;
        const ci = colorIdx(name);
        return {
          name,
          val,
          pct: Math.round((val / total) * 100),
          angle,
          start,
          color: PALETTE[ci],
        };
      });
  }, [subscriptions]);

  const cx = 90;
  const cy = 90;
  const r = 68;
  const ri = 44;

  function arc(slice: (typeof slices)[0]) {
    const x1 = cx + r * Math.cos(slice.start);
    const y1 = cy + r * Math.sin(slice.start);
    const x2 = cx + r * Math.cos(slice.start + slice.angle);
    const y2 = cy + r * Math.sin(slice.start + slice.angle);
    const xi1 = cx + ri * Math.cos(slice.start);
    const yi1 = cy + ri * Math.sin(slice.start);
    const xi2 = cx + ri * Math.cos(slice.start + slice.angle);
    const yi2 = cy + ri * Math.sin(slice.start + slice.angle);
    const large = slice.angle > Math.PI ? 1 : 0;

    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${large} 0 ${xi1} ${yi1} Z`;
  }

  const monthlyTotal = subscriptions.reduce(
    (s, x) => s + (x.type === "MONTHLY" ? x.amount : Math.round(x.amount / 12)),
    0
  );

  return (
    <div className={styles.chartCard}>
      <p className={styles.chartTitle}>제공사별 월 지출 비중</p>
      <div className={styles.donutWrap}>
        <svg viewBox="0 0 180 180" width={160} height={160} style={{ flexShrink: 0 }}>
          {slices.map((s, i) => (
            <path key={i} d={arc(s)} fill={s.color} opacity={0.9} />
          ))}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
            월 합계
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="var(--text-primary)"
          >
            {Math.round(monthlyTotal / 1000)}K원
          </text>
        </svg>

        <div className={styles.legend}>
          {slices.map((s, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              <span className={styles.legendName}>{s.name}</span>
              <span className={styles.legendPct}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BarChart({ subscriptions }: { subscriptions: Subscription[] }) {
  const bars = useMemo(() => {
    const sorted = [...subscriptions]
      .map((s) => ({
        name: s.name,
        providerName: s.providerName,
        monthly: s.type === "MONTHLY" ? s.amount : Math.round(s.amount / 12),
      }))
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 7);

    const max = sorted[0]?.monthly ?? 1;

    return sorted.map((s) => ({
      ...s,
      pct: (s.monthly / max) * 100,
      ci: colorIdx(s.providerName),
    }));
  }, [subscriptions]);

  return (
    <div className={styles.chartCard}>
      <p className={styles.chartTitle}>구독별 월 지출 순위</p>
      <div className={styles.barList}>
        {bars.map((b, i) => (
          <div key={i} className={styles.barRow}>
            <span className={styles.barLabel} title={b.name}>
              {b.name}
            </span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${b.pct}%`, background: PALETTE[b.ci] }}
              />
            </div>
            <span className={styles.barAmt}>{fmt(b.monthly)}</span>
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
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
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
      if (modal?.mode === "edit" && modal.sub) await update(modal.sub.id, payload);
      else await create(payload);

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
          <DonutChart subscriptions={subscriptions} />
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
            <p className={styles.emptyDesc}>
              구독 추가 버튼을 눌러 첫 번째 구독을 등록해 보세요.
            </p>
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
                        <span className={styles.nameTxt}>{sub.name}</span>
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
