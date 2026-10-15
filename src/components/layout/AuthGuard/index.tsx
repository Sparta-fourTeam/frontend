"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserInfo } from "@/store/useUserInfo";

// TODO: 테스트용 로그인 우회. 테스트 끝나면 false로 되돌리기
const SKIP_AUTH = true;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserInfo((state) => state.user);
  const [hydrated, setHydrated] = useState(() => useUserInfo.persist.hasHydrated());

  useEffect(() => useUserInfo.persist.onFinishHydration(() => setHydrated(true)), []);

  useEffect(() => {
    if (!SKIP_AUTH && hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  if (SKIP_AUTH) return <>{children}</>;
  if (!hydrated || !user) return null;
  return <>{children}</>;
}
