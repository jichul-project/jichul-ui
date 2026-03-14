// "use client";
//
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { api } from "@/lib/api";
// import { login } from "@/lib/auth";
// import styles from "../login/page.module.css";
//
// export default function RegisterPage() {
//   const router = useRouter();
//   const [form, setForm] = useState({ email: "", password: "", name: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//
//   function set(key: string, value: string) {
//     setForm((prev) => ({ ...prev, [key]: value }));
//   }
//
//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
//     try {
//       const res = await api.post("/api/auth/register", form);
//       if (!res.success) throw new Error(res.message ?? "회원가입 실패");
//       await login(form.email, form.password);
//       router.push("/subscriptions");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
//     } finally {
//       setLoading(false);
//     }
//   }
//
//   return (
//     <div className={styles.wrap}>
//       <div className={styles.card}>
//         <h1 className={styles.title}>회원가입</h1>
//         <p className={styles.sub}>지출 관리를 시작하세요</p>
//
//         <form onSubmit={handleSubmit} className={styles.form}>
//           {error && <p className={styles.error}>{error}</p>}
//
//           <div className={styles.field}>
//             <label className={styles.label}>이름</label>
//             <input
//               className={styles.input}
//               value={form.name}
//               onChange={(e) => set("name", e.target.value)}
//               placeholder="홍길동"
//               required
//               autoFocus
//             />
//           </div>
//
//           <div className={styles.field}>
//             <label className={styles.label}>이메일</label>
//             <input
//               type="email"
//               className={styles.input}
//               value={form.email}
//               onChange={(e) => set("email", e.target.value)}
//               placeholder="you@example.com"
//               required
//             />
//           </div>
//
//           <div className={styles.field}>
//             <label className={styles.label}>비밀번호 (8자 이상)</label>
//             <input
//               type="password"
//               className={styles.input}
//               value={form.password}
//               onChange={(e) => set("password", e.target.value)}
//               placeholder="••••••••"
//               required
//               minLength={8}
//             />
//           </div>
//
//           <button type="submit" className={styles.btn} disabled={loading}>
//             {loading ? "처리 중..." : "회원가입"}
//           </button>
//         </form>
//
//         <p className={styles.footer}>
//           이미 계정이 있으신가요?{" "}
//           <a href="/login" className={styles.link}>로그인</a>
//         </p>
//       </div>
//     </div>
//   );
// }
