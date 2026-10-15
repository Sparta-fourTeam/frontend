"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import classnames from "classnames/bind";
import s from "../signIn.module.scss";

const cx = classnames.bind(s);

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

interface GoogleLoginButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

// 구글 공식 로그인 버튼 (Google Identity Services)
export default function GoogleLoginButton({ onCredential, disabled }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  // 다른 화면에 갔다 돌아오면 스크립트가 이미 로드돼 있어서 onLoad 가 다시 안 불림
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined" && !!window.google);

  useEffect(() => {
    callbackRef.current = onCredential;
  });

  useEffect(() => {
    const google = window.google;
    const element = buttonRef.current;
    if (!loaded || !google || !element || !GOOGLE_CLIENT_ID) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => callbackRef.current(credential),
    });
    google.accounts.id.renderButton(element, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      locale: "ko",
      width: Math.min(400, element.offsetWidth),
    });
  }, [loaded]);

  if (!GOOGLE_CLIENT_ID) {
    return <p className={cx("error")}>NEXT_PUBLIC_GOOGLE_CLIENT_ID 가 설정되지 않았습니다.</p>;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <div ref={buttonRef} className={cx("googleButton", { disabled })} />
    </>
  );
}
