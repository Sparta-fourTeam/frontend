"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import classnames from "classnames/bind";
import s from "./Sidebar.module.scss";
import { MENU, type MenuItem } from "@/constants/menu";
import { webLogout } from "@/apis/auth";
import { useUserInfo } from "@/store/useUserInfo";

const cx = classnames.bind(s);

export default function Sidebar() {
  return (
    <aside className={cx("sidebar")}>
      <Link href="/skills" className={cx("logo")}>
        두들두들
      </Link>
      <nav className={cx("nav")}>
        <MenuList items={MENU} depth={0} />
      </nav>
      <LogoutButton />
    </aside>
  );
}

function LogoutButton() {
  const router = useRouter();
  const clearUser = useUserInfo((state) => state.clearUser);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    if (busy || !confirm("로그아웃할까요?")) return;
    setBusy(true);
    // 서버 요청이 실패해도 화면에서는 로그아웃 처리한다.
    await webLogout();
    clearUser();
    router.replace("/auth");
  };

  return (
    <div className={cx("footer")}>
      <button
        type="button"
        className={cx("logout")}
        onClick={handleLogout}
        disabled={busy}
      >
        {busy ? "로그아웃 중..." : "로그아웃"}
      </button>
    </div>
  );
}

function MenuList({ items, depth }: { items: MenuItem[]; depth: number }) {
  return (
    <ul className={cx("menuList")}>
      {items.map((item) => (
        <MenuNode key={item.label} item={item} depth={depth} />
      ))}
    </ul>
  );
}

function MenuNode({ item, depth }: { item: MenuItem; depth: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const hasChildren = !!item.children?.length;

  const isActive =
    matches(item.path, pathname) &&
    !item.children?.some((c) => matchesDeep(c, pathname));

  const label = item.path ? (
    <Link href={item.path} className={cx("label")}>
      {item.label}
    </Link>
  ) : (
    <button
      type="button"
      className={cx("label")}
      onClick={() => setOpen(!open)}
    >
      {item.label}
    </button>
  );

  return (
    <li>
      <div
        className={cx("item", { active: isActive })}
        style={{ paddingLeft: 16 + depth * 16 }}
      >
        {label}
        {hasChildren && (
          <button
            type="button"
            className={cx("toggle", { open })}
            onClick={() => setOpen(!open)}
            aria-label={open ? "메뉴 접기" : "메뉴 펼치기"}
          >
            ▸
          </button>
        )}
      </div>
      {hasChildren && open && (
        <MenuList items={item.children!} depth={depth + 1} />
      )}
    </li>
  );
}

function matches(path: string | undefined, pathname: string) {
  return !!path && (pathname === path || pathname.startsWith(`${path}/`));
}

function matchesDeep(item: MenuItem, pathname: string): boolean {
  return (
    matches(item.path, pathname) ||
    !!item.children?.some((c) => matchesDeep(c, pathname))
  );
}
