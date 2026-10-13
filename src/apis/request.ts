import { useUserInfo } from "@/store/useUserInfo";

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
  const { user, setUser } = useUserInfo.getState();
  if (!user?.refreshToken) return false;
  const response = await fetch(
    "/api/auth/refresh",
    jsonRequest("POST", { refreshToken: user.refreshToken }),
  );
  if (!response.ok) return false;
  const tokens: { accessToken: string; refreshToken: string } = await response.json();
  setUser({ ...user, ...tokens });
  return true;
};

let refreshing: Promise<boolean> | null = null;

export const apiFetch = async (path: string, init?: RequestInit) => {
  const response = await fetch(path, withToken(init));
  if (response.status !== 401 || !useUserInfo.getState().user) return response;

  refreshing ??= refreshTokens().finally(() => {
    refreshing = null;
  });
  if (await refreshing) return fetch(path, withToken(init));

  useUserInfo.getState().clearUser();
  window.location.replace("/auth");
  return response;
};
