import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LoginType } from "@/apis/auth";

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
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "user-info",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
