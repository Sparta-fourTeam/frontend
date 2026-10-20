import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LoginType } from "@/apis/auth";
import { SESSION_COOKIE } from "@/constants/session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30일 (토큰 갱신 때마다 연장)

// proxy.ts 가 보는 로그인 표시 쿠키를 맞춰 둔다.
const markSession = (signedIn: boolean) => {
  if (typeof document === "undefined") return;
  document.cookie = signedIn
    ? `${SESSION_COOKIE}=1; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`
    : `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

export interface User {
  accessToken: string;
  loginType: LoginType;
  userId?: number;
  nickname?: string;
}

interface UserInfo {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserInfo = create<UserInfo>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => {
        markSession(true);
        set({ user, isAuthenticated: true });
      },
      clearUser: () => {
        markSession(false);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "user-info",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
