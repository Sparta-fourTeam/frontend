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
