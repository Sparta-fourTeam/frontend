import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SKIP_AUTH } from "@/constants/session";

// 로그인 표시 쿠키가 없으면 화면을 그리기 전에 로그인 화면으로 보낸다.
// (토큰은 localStorage에 있어 서버에서 볼 수 없으므로, 권한 검사는 AuthGuard·API가 맡는다.)
export function proxy(request: NextRequest) {
  if (SKIP_AUTH || request.cookies.has(SESSION_COOKIE))
    return NextResponse.next();
  return NextResponse.redirect(new URL("/auth", request.url));
}

export const config = {
  // 로그인 화면, API 프록시, 정적 파일은 제외
  matcher: ["/((?!auth|api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
