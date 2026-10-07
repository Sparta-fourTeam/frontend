"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../signIn.module.scss";
import Button from "@/components/common/Button";
import GoogleIcon from "@/components/icons/GoogleIcon";
import { login, type LoginType } from "@/apis/auth";
import { useUserInfo } from "@/store/useUserInfo";

const cx = classnames.bind(s);

export default function SignInForm() {
  const router = useRouter();
  const setUser = useUserInfo((state) => state.setUser);
  const [loading, setLoading] = useState<LoginType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginType: LoginType) => {
    setLoading(loginType);
    setError(null);
    try {
      // TODO: 구글 로그인은 추후 구글 SDK로 토큰 받아서 token 필드에 넣기
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
      <Button
        variant="outline"
        fullWidth
        onClick={() => handleLogin("GOOGLE")}
        disabled={loading !== null}
      >
        <GoogleIcon />
        {loading === "GOOGLE" ? "로그인 중..." : "Google로 로그인"}
      </Button>

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
