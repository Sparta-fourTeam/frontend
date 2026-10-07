import { create } from "zustand";
import type { LoginType } from "@/apis/auth";

export interface User {
  userId: number;
  nickname: string;
  accessToken: string;
  loginType: LoginType;
}

interface UserInfo {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserInfo = create<UserInfo>()((set) => ({
  user: null,
  isAuthenticated: false,

  // 로그인 성공 시 사용자 정보 저장
  setUser: (user) => set({ user, isAuthenticated: true }),

  // 로그아웃 시 사용자 정보 초기화
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));
