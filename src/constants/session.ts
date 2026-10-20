// 로그인 여부 표시 쿠키. 토큰이 아니라 "로그인한 적 있음" 표시만 담는다.
// 화면 주소 요청에는 refresh 쿠키(/api/auth/web 경로)가 실리지 않아서,
// proxy.ts 가 화면을 그리기 전에 로그인 화면으로 보낼 수 있도록 따로 둔다.
// 실제 권한 검사는 서버 API(JWT)와 AuthGuard가 한다.
export const SESSION_COOKIE = "admin_session";

// 로컬 테스트용 로그인 우회: .env.local 에 NEXT_PUBLIC_SKIP_AUTH=true
export const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
