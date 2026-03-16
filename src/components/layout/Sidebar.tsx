"use client";

import Link from "next/link";
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

        <nav className={styles.nav} aria-label="대시보드 메뉴">
          {NAV.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className={styles.linkLabel}>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={styles.bottom}>
        <button type="button" className={styles.logout} onClick={logout}>
          <span className={styles.logoutIcon} aria-hidden="true">
            ↪
          </span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
