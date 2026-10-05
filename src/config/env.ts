// 환경변수는 여기서만 읽고, 다른 곳에서는 이 객체를 import 해서 사용합니다.
export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "FinalProject",
} as const;
