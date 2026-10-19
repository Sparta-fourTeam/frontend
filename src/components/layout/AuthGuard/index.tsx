"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserInfo } from "@/store/useUserInfo";

// TODO: 테스트용 로그인 우회. 테스트 끝나면 false로 되돌리기
const SKIP_AUTH = true;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserInfo((state) => state.user);
  // 서버 렌더링(프리렌더) 중에는 localStorage가 없어 persist API가 붙지 않으므로 옵셔널 체이닝으로 접근한다.
  const [hydrated, setHydrated] = useState(
    () => useUserInfo.persist?.hasHydrated() ?? false,
  );

  useEffect(
    () => useUserInfo.persist?.onFinishHydration(() => setHydrated(true)),
    [],
  );

  useEffect(() => {
    if (!SKIP_AUTH && hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  if (SKIP_AUTH) return <>{children}</>;
  if (!hydrated || !user) return null;
  return <>{children}</>;
}
