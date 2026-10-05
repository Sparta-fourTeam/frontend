import { ApiError } from "./ApiError";

// 브라우저/서버 공통으로 /api 경로를 사용합니다. (next.config.ts 의 rewrites 로 백엔드에 전달)
// 서버 컴포넌트에서 호출할 때는 상대경로가 동작하지 않으므로 API_BASE_URL 을 직접 사용합니다.
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.API_BASE_URL ?? "http://localhost:8080")
    : "";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "method" | "body"> {
  body?: unknown;
}

async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include", // 쿠키 기반 인증(세션/JWT 쿠키)을 쓸 경우 필요
    ...rest,
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const err = await res.json();
      message = err.message ?? message;
      code = err.code;
    } catch {
      // JSON 이 아닌 에러 응답
    }
    throw new ApiError(res.status, message, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
