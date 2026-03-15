"use client";

import React, { useState } from "react";
import { useProviders } from "@/hooks/useProviders";
import Modal from "@/components/ui/Modal";
import type { Provider } from "@/types";
import styles from "./page.module.css";
import f from "@/components/ui/form.module.css";

export default function ProvidersPage() {
  const { providers, loading, error, create, update, remove } = useProviders();
  const [modal, setModal] = useState<{ mode: "create" | "edit"; provider?: Provider } | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openCreate() {
    setName("");
    setFormError("");
    setModal({ mode: "create" });
  }

  function openEdit(provider: Provider) {
    setName(provider.name);
    setFormError("");
    setModal({ mode: "edit", provider });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setFormError("");
    setSubmitting(true);
    try {
      if (modal?.mode === "edit" && modal.provider) {
        await update(modal.provider.id, name.trim());
      } else {
        await create(name.trim());
      }
      setModal(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(provider: Provider) {
    if (!confirm(`"${provider.name}" 제공사를 삭제할까요?`)) return;
    try {
      await remove(provider.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>제공사 관리</h1>
          <p className={styles.subtitle}>구독 서비스 제공사를 등록하고 관리합니다.</p>
        </div>
        <button className={styles.btnAdd} onClick={openCreate}>+ 추가</button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.section}>
        {loading ? (
          <p className={styles.empty}>불러오는 중...</p>
        ) : providers.length === 0 ? (
          <p className={styles.empty}>등록된 제공사가 없습니다. 추가 버튼을 눌러 시작하세요.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>제공사 이름</th>
                <th>등록일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr key={p.id}>
                  <td className={styles.nameCell}>{p.name}</td>
                  <td className={styles.dateCell}>
                    {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.btnEdit} onClick={() => openEdit(p)}>수정</button>
                    <button className={styles.btnDel} onClick={() => handleDelete(p)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === "create" ? "제공사 추가" : "제공사 수정"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSubmit} className={f.form}>
            {formError && <p className={f.error}>{formError}</p>}
            <div className={f.field}>
              <label className={f.label}>제공사 이름</label>
              <input
                className={f.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: Netflix"
                required
                autoFocus
                maxLength={100}
              />
            </div>
            <div className={f.actions}>
              <button type="button" className={f.btnCancel} onClick={() => setModal(null)}>취소</button>
              <button type="submit" className={f.btnSubmit} disabled={submitting || !name.trim()}>
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
