"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import styles from "./Sidebar.module.css";

const NAV = [
  { href: "/subscriptions", label: "구독 목록" },
  { href: "/providers", label: "제공사 관리" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
        <button className={styles.logout} onClick={logout}>
          로그아웃
        </button>
      </div>
    </aside>
  );
}
