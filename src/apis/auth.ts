import { jsonRequest, throwIfFailed } from "./request";

export type LoginType = "GOOGLE" | "GUEST";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface LoginRequest {
  loginType: LoginType;
  // 구글 로그인 시 구글에서 받은 토큰 (추후 연동)
  token?: string;
}

interface LoginResponse {
  accessToken: string;
  userId: number;
  nickname: string;
}

// 로그인 API (임시)
// /api/** 요청은 next.config.ts 의 rewrites 로 백엔드에 전달됨
export const login = async (body: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("로그인에 실패했습니다.");
  }

  return response.json();
};

// 구글 로그인 (가입이 안 되어 있으면 서버에서 가입까지 처리)
// idToken: 구글 로그인 후 받은 ID 토큰(credential)
export const socialLogin = async (idToken: string): Promise<TokenResponse> => {
  const response = await fetch(
    "/api/social/login",
    jsonRequest("POST", { provider: "GOOGLE", idToken, clientType: "WEB" }),
  );
  await throwIfFailed(response);
  return response.json();
};
