"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserInfo } from "@/store/useUserInfo";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useUserInfo((state) => state.user);
  const [hydrated, setHydrated] = useState(() => useUserInfo.persist.hasHydrated());

  useEffect(() => useUserInfo.persist.onFinishHydration(() => setHydrated(true)), []);

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;
  return <>{children}</>;
}
