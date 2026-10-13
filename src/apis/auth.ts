import { jsonRequest, throwIfFailed } from "./request";

export type LoginType = "GOOGLE";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 구글 로그인
// idToken: 구글 로그인 후 받은 ID 토큰(credential)
export const socialLogin = async (idToken: string): Promise<TokenResponse> => {
  const response = await fetch(
    "/api/social/login",
    jsonRequest("POST", { provider: "GOOGLE", idToken, clientType: "WEB" }),
  );
  await throwIfFailed(response);
  return response.json();
};
