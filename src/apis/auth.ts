import { jsonRequest, throwIfFailed } from "./request";

export type LoginType = "GOOGLE";

export interface AccessTokenResponse {
  accessToken: string;
}

export const socialLogin = async (
  idToken: string,
): Promise<AccessTokenResponse> => {
  const response = await fetch(
    "/api/auth/web/login",
    jsonRequest("POST", { provider: "GOOGLE", idToken }),
  );
  await throwIfFailed(response);
  return response.json();
};

// access 토큰(JWT) payload의 role 클레임. 서버는 ADMIN만 관리자 API(/api/admin/**)를 허용한다.
export const ADMIN_ROLE = "ADMIN";

export const getTokenRole = (token?: string | null): string | null => {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(
      atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")),
    );
    return typeof json.role === "string" ? json.role : null;
  } catch {
    return null;
  }
};

export const isAdminToken = (token?: string | null) =>
  getTokenRole(token) === ADMIN_ROLE;

// access 토큰의 subject = 유저 id
export const getTokenUserId = (token?: string | null): number | null => {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(
      atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")),
    );
    const id = Number(json.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
};

// refresh 쿠키를 지운다. 서버는 쿠키가 없거나 만료돼도 항상 204를 준다.
export const webLogout = async () => {
  await fetch("/api/auth/web/logout", { method: "POST" }).catch(() => null);
};

// 로그인 화면으로 보낼 때 안내 문구를 고르는 사유
export type SignOutReason = "forbidden" | "expired";

export const SIGN_OUT_MESSAGE: Record<SignOutReason, string> = {
  forbidden: "관리자 권한이 없는 계정입니다. 관리자 계정으로 로그인하세요.",
  expired: "로그인이 만료되었습니다. 다시 로그인하세요.",
};

export const signInPath = (reason?: SignOutReason) =>
  reason ? `/auth?reason=${reason}` : "/auth";
