"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../signIn.module.scss";
import GoogleLoginButton from "./googleLoginButton";
import { SIGN_OUT_MESSAGE, isAdminToken, socialLogin, webLogout } from "@/apis/auth";
import { useUserInfo } from "@/store/useUserInfo";

const cx = classnames.bind(s);

interface SignInFormProps {
  // 로그인 화면으로 보내진 사유 안내 (권한 없음·만료)
  notice?: string | null;
}

export default function SignInForm({ notice = null }: SignInFormProps) {
  const router = useRouter();
  const setUser = useUserInfo((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(notice);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await socialLogin(idToken);
      // 관리자가 아닌 계정은 발급된 refresh 쿠키까지 지우고 들여보내지 않는다.
      if (!isAdminToken(accessToken)) {
        await webLogout();
        setError(SIGN_OUT_MESSAGE.forbidden);
        return;
      }
      setUser({ accessToken, loginType: "GOOGLE" });
      router.push("/skills");
    } catch (e) {
      setError(e instanceof Error ? e.message : "구글 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx("buttonContainer")}>
      <GoogleLoginButton onCredential={handleGoogleLogin} disabled={loading} />

      {error && <p className={cx("error")}>{error}</p>}
    </div>
  );
}
