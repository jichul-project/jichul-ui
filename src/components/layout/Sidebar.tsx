"use client";

import { usePathname } from "next/navigation";
import { logout, getStoredUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import styles from "./Sidebar.module.css";

const NAV = [
  { href: "/subscriptions", label: "구독 목록" },
  { href: "/providers", label: "제공사 관리" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [name, setName] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const res = await api.get<{ id: string; email: string; name: string }>("/api/auth/me");

        if (mounted && res.success && res.data) {
          setName(res.data.name);

          localStorage.setItem(
            "user",
            JSON.stringify({
              id: res.data.id,
              email: res.data.email,
              name: res.data.name,
            })
          );

          return;
        }
      } catch {
        // fallback below
      }

      const storedUser = getStoredUser();
      if (mounted && storedUser) {
        setName(storedUser.name);
      }
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <span className={styles.logo}>지출 관리</span>
        <nav className={styles.nav}>
          {NAV.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={`${styles.link} ${pathname.startsWith(href) ? styles.active : ""}`}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        {name && <span className={styles.user}>{name}</span>}
        <button className={styles.logout} onClick={logout}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
