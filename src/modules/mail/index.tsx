"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "./mail.module.scss";
import Title from "@/components/common/Title";
import MailForm, { userLabel, type SentResult } from "./components/mailForm";
import MailItems from "./components/mailItems";
import UserMailbox from "./components/userMailbox";
import type { UserSummary } from "@/apis/mail";

const cx = classnames.bind(s);

interface SentLog extends SentResult {
  id: number;
  sentAt: Date;
}

const PREVIEW_USERS = 8;
let seq = 0;

export default function MailManager() {
  // 서버에 발송 내역 조회 API가 없어 이 화면에서 보낸 것만 보여준다.
  const [sent, setSent] = useState<SentLog[]>([]);
  const [viewUser, setViewUser] = useState<UserSummary | null>(null);
  const [mailboxKey, setMailboxKey] = useState(0);

  const handleSent = (result: SentResult) => {
    setSent((prev) => [{ ...result, id: ++seq, sentAt: new Date() }, ...prev]);
    // 지금 보고 있는 유저가 받는 사람에 포함되면 우편함을 새로 불러온다.
    if (
      viewUser &&
      (result.mode === "all" ||
        result.users.some((u) => u.userId === viewUser.userId))
    )
      setMailboxKey((k) => k + 1);
  };

  return (
    <>
      <Title
        title="우편 발송"
        subtitle="유저에게 메시지와 경험치·골드·젬·에너지·아이템을 보냅니다. 접속 중이면 실시간(SSE)으로 전달됩니다"
        align="left"
      />

      <MailForm onSent={handleSent} />

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          이번에 보낸 우편
          <span className={cx("hint")}>
            새로고침하면 사라집니다 · 받는 사람을 누르면 아래에서 우편함을
            봅니다
          </span>
        </h2>
        {sent.length === 0 ? (
          <p className={cx("empty")}>아직 보낸 우편이 없습니다.</p>
        ) : (
          <div className={cx("list")}>
            {sent.map((log) => (
              <article key={log.id} className={cx("item")}>
                <div className={cx("itemHead")}>
                  <span className={cx("itemTitle")}>{log.content.title}</span>
                  <span className={cx("meta")}>
                    {log.mode === "all"
                      ? `전체 유저 ${log.sentCount}명`
                      : `${log.sentCount}명`}{" "}
                    ·{" "}
                    {log.sentAt.toLocaleTimeString("ko-KR", { hour12: false })}
                  </span>
                </div>
                <p className={cx("itemContent")}>{log.content.content}</p>
                <MailItems {...log.content} />
                {log.mode === "users" && (
                  <div className={cx("chips", "sentTo")}>
                    {log.users.slice(0, PREVIEW_USERS).map((user) => (
                      <button
                        key={user.userId}
                        type="button"
                        className={cx("recipientLink")}
                        onClick={() => setViewUser(user)}
                      >
                        {userLabel(user)}
                      </button>
                    ))}
                    {log.users.length > PREVIEW_USERS && (
                      <span className={cx("meta")}>
                        외 {log.users.length - PREVIEW_USERS}명
                      </span>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <UserMailbox
        user={viewUser}
        reloadKey={mailboxKey}
        onSelect={setViewUser}
      />
    </>
  );
}
