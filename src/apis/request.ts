import { useUserInfo } from "@/store/useUserInfo";
import { isAdminToken, signInPath, webLogout, type SignOutReason } from "./auth";

export const throwIfFailed = async (response: Response) => {
  if (response.ok) return;
  const data = await response.json().catch(() => null);
  throw new Error(data?.message ?? "요청에 실패했습니다.");
};

export const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const withToken = (init?: RequestInit): RequestInit => {
  const token = useUserInfo.getState().user?.accessToken;
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
};

const refreshTokens = async () => {
  const response = await fetch("/api/auth/web/refresh", { method: "POST" });
  const { user, setUser } = useUserInfo.getState();
  if (!response.ok || !user) return false;
  const { accessToken }: { accessToken: string } = await response.json();
  setUser({ ...user, accessToken });
  return true;
};

let refreshing: Promise<boolean> | null = null;

// 로그인 정보를 지우고 로그인 화면으로 보낸다.
export const signOut = async (reason?: SignOutReason) => {
  useUserInfo.getState().clearUser();
  await webLogout();
  window.location.replace(signInPath(reason));
};

export const apiFetch = async (path: string, init?: RequestInit) => {
  const response = await fetch(path, withToken(init));
  const user = useUserInfo.getState().user;
  if (!user) return response;

  // 관리자 권한이 없는 계정(403)은 로그인 화면으로 보낸다.
  if (response.status === 403 && !isAdminToken(user.accessToken)) {
    await signOut("forbidden");
    return response;
  }
  if (response.status !== 401) return response;

  refreshing ??= refreshTokens().finally(() => {
    refreshing = null;
  });
  if (await refreshing) return fetch(path, withToken(init));

  await signOut("expired");
  return response;
};
