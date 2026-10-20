"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useUserInfo } from "@/store/useUserInfo";
import { isAdminToken, signInPath, webLogout } from "@/apis/auth";
import { SKIP_AUTH } from "@/constants/session";

const subscribeHydration = (onChange: () => void) =>
  useUserInfo.persist?.onFinishHydration(onChange) ?? (() => {});
const getHydrated = () => useUserInfo.persist?.hasHydrated() ?? false;
const getServerHydrated = () => false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserInfo((state) => state.user);
  const hydrated = useSyncExternalStore(subscribeHydration, getHydrated, getServerHydrated);

  const isAdmin = isAdminToken(user?.accessToken);

  useEffect(() => {
    if (SKIP_AUTH || !hydrated) return;
    // 로그인 정보가 없으면 로그인 표시 쿠키도 지우고 로그인 화면으로 보낸다.
    if (!user) {
      useUserInfo.getState().clearUser();
      router.replace("/auth");
      return;
    }
    // 로그인은 됐지만 관리자 권한(ADMIN)이 없는 계정
    if (!isAdmin) {
      useUserInfo.getState().clearUser();
      void webLogout();
      router.replace(signInPath("forbidden"));
    }
  }, [hydrated, user, isAdmin, router]);

  if (SKIP_AUTH) return <>{children}</>;
  if (!hydrated || !user || !isAdmin) return null;
  return <>{children}</>;
}
