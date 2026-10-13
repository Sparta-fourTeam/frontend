import { jsonRequest, throwIfFailed } from "./request";

export type LoginType = "GOOGLE";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const socialLogin = async (idToken: string): Promise<TokenResponse> => {
  const response = await fetch(
    "/api/auth/web/login",
    jsonRequest("POST", { provider: "GOOGLE", idToken }),
  );
  await throwIfFailed(response);
  return response.json();
};
