"use client";

import { useEffect, useState } from "react";
import classnames from "classnames/bind";
import s from "../mail.module.scss";
import Button from "@/components/common/Button";
import MailItems from "./mailItems";
import UserPickerModal from "./userPickerModal";
import { userLabel } from "./mailForm";
import {
  ApiNotReadyError,
  MAIL_RETENTION_DAYS,
  getUserMails,
  type Mail,
  type UserSummary,
} from "@/apis/mail";

const cx = classnames.bind(s);

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("ko-KR", { hour12: false });
};

// 자동 삭제까지 남은 일수 (보낸 뒤 30일)
const daysLeft = (iso: string) => {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return null;
  return Math.max(
    0,
    Math.ceil((created + MAIL_RETENTION_DAYS * DAY_MS - Date.now()) / DAY_MS),
  );
};

interface UserMailboxProps {
  user: UserSummary | null;
  // 같은 유저에게 다시 보냈을 때 목록을 새로 불러오기 위한 값
  reloadKey: number;
  onSelect: (user: UserSummary | null) => void;
}

// 선택한 유저의 우편함 (보낸 우편과 수령 여부 확인)
export default function UserMailbox({
  user,
  reloadKey,
  onSelect,
}: UserMailboxProps) {
  const [idInput, setIdInput] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mails, setMails] = useState<Mail[]>([]);
  // 마지막으로 불러온 조회 조건. 현재 조건과 다르면 불러오는 중으로 본다.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [version, setVersion] = useState(0);

  const userId = user?.userId ?? null;
  const requestKey = `${userId}-${reloadKey}-${version}`;
  const loading = userId != null && loadedKey !== requestKey;

  useEffect(() => {
    if (userId == null) return;
    let ignore = false;
    getUserMails(userId)
      .then((data) => {
        if (ignore) return;
        setMails(data);
        setError(null);
        setNotReady(false);
      })
      .catch((e) => {
        if (ignore) return;
        setMails([]);
        setNotReady(e instanceof ApiNotReadyError);
        setError(
          e instanceof Error ? e.message : "우편함을 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        if (!ignore) setLoadedKey(requestKey);
      });
    return () => {
      ignore = true;
    };
  }, [userId, requestKey]);

  const select = (next: UserSummary) => onSelect(next);

  const selectById = () => {
    const id = Number(idInput.trim());
    if (!Number.isInteger(id) || id < 1) return;
    setIdInput("");
    select({ userId: id, nickname: null });
  };

  const claimedCount = mails.filter((m) => m.claimed).length;

  return (
    <section className={cx("card")}>
      <div className={cx("header")}>
        <h2 className={cx("cardTitle")}>
          유저 우편함
          <span className={cx("hint")}>
            최신순 · {MAIL_RETENTION_DAYS}일 지나면 자동 삭제
          </span>
        </h2>
        {user && (
          <Button
            size="small"
            variant="outline"
            onClick={() => setVersion((v) => v + 1)}
            disabled={loading}
          >
            새로고침
          </Button>
        )}
      </div>

      <div className={cx("recipientActions")}>
        <Button size="small" onClick={() => setPickerOpen(true)}>
          닉네임으로 검색
        </Button>
        <input
          className={cx("input", "idInput")}
          value={idInput}
          onChange={(e) => setIdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              selectById();
            }
          }}
          placeholder="유저 ID로 조회"
        />
        <Button size="small" variant="outline" onClick={selectById}>
          조회
        </Button>
        {user && (
          <span className={cx("viewing")}>
            {userLabel(user)}
            <button
              type="button"
              onClick={() => onSelect(null)}
              aria-label="선택 해제"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {!user ? (
        <p className={cx("empty")}>
          유저를 선택하면 그 유저의 우편함이 표시됩니다. 위에서 보낸 우편의 받는
          사람을 눌러도 됩니다.
        </p>
      ) : loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : error ? (
        <p className={cx(notReady ? "warning" : "error", "boxMessage")}>
          {error}
          {notReady &&
            " 서버의 GET /api/admin/mails?userId= 응답을 확인하세요."}
        </p>
      ) : mails.length === 0 ? (
        <p className={cx("empty")}>받은 우편이 없습니다.</p>
      ) : (
        <>
          <p className={cx("meta", "boxSummary")}>
            전체 {mails.length}통 · 수령 {claimedCount}통 · 미수령{" "}
            {mails.length - claimedCount}통
          </p>
          <div className={cx("list")}>
            {mails.map((mail) => {
              const left = daysLeft(mail.createdAt);
              return (
                <article key={mail.id} className={cx("item")}>
                  <div className={cx("itemHead")}>
                    <span className={cx("itemTitle")}>{mail.title}</span>
                    <span
                      className={cx(
                        mail.claimed ? "claimedBadge" : "unclaimedBadge",
                      )}
                    >
                      {mail.claimed ? "수령 완료" : "미수령"}
                    </span>
                    <span className={cx("meta")}>
                      #{mail.id} · {formatDate(mail.createdAt)}
                      {left != null &&
                        ` · ${left === 0 ? "곧 삭제" : `${left}일 후 삭제`}`}
                    </span>
                  </div>
                  <p className={cx("itemContent")}>{mail.content}</p>
                  <MailItems {...mail} />
                </article>
              );
            })}
          </div>
        </>
      )}

      {pickerOpen && (
        <UserPickerModal
          single
          title="우편함을 볼 유저 선택"
          selected={user ? [user] : []}
          onClose={() => setPickerOpen(false)}
          onConfirm={([picked]) => {
            setPickerOpen(false);
            if (picked) select(picked);
          }}
        />
      )}
    </section>
  );
}
