"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../signIn.module.scss";
import Button from "@/components/common/Button";
import GoogleLoginButton from "./googleLoginButton";
import { login, socialLogin, type LoginType } from "@/apis/auth";
import { useUserInfo } from "@/store/useUserInfo";

const cx = classnames.bind(s);

export default function SignInForm() {
  const router = useRouter();
  const setUser = useUserInfo((state) => state.setUser);
  const [loading, setLoading] = useState<LoginType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading("GOOGLE");
    setError(null);
    try {
      const tokens = await socialLogin(idToken);
      setUser({ ...tokens, loginType: "GOOGLE" });
      router.push("/skills");
    } catch (e) {
      setError(e instanceof Error ? e.message : "구글 로그인에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  };

  const handleLogin = async (loginType: LoginType) => {
    setLoading(loginType);
    setError(null);
    try {
      const data = await login({ loginType });

      setUser({
        userId: data.userId,
        nickname: data.nickname,
        accessToken: data.accessToken,
        loginType,
      });

      // TODO: 로그인 후 이동할 페이지 생기면 경로 변경
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={cx("buttonContainer")}>
      <GoogleLoginButton onCredential={handleGoogleLogin} disabled={loading !== null} />

      <Button
        variant="primary"
        fullWidth
        onClick={() => handleLogin("GUEST")}
        disabled={loading !== null}
      >
        {loading === "GUEST" ? "로그인 중..." : "게스트로 시작하기"}
      </Button>

      {error && <p className={cx("error")}>{error}</p>}
    </div>
  );
}
