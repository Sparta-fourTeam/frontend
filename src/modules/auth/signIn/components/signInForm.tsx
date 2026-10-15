"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../signIn.module.scss";
import GoogleLoginButton from "./googleLoginButton";
import { socialLogin } from "@/apis/auth";
import { useUserInfo } from "@/store/useUserInfo";

const cx = classnames.bind(s);

export default function SignInForm() {
  const router = useRouter();
  const setUser = useUserInfo((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await socialLogin(idToken);
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
