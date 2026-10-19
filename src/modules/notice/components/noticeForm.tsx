"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../notice.module.scss";
import Button from "@/components/common/Button";
import {
  NOTICE_CONTENT_MAX,
  NOTICE_RETENTION_DAYS,
  NOTICE_TITLE_MAX,
  createNotice,
  type Notice,
} from "@/apis/notice";

const cx = classnames.bind(s);

interface NoticeFormProps {
  onCreated: (notice: Notice) => void;
}

export default function NoticeForm({ onCreated }: NoticeFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!title.trim()) return "제목을 입력하세요.";
    if (title.trim().length > NOTICE_TITLE_MAX)
      return `제목은 ${NOTICE_TITLE_MAX}자 이하입니다.`;
    if (!content.trim()) return "내용을 입력하세요.";
    if (content.trim().length > NOTICE_CONTENT_MAX)
      return `내용은 ${NOTICE_CONTENT_MAX}자 이하입니다.`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSent(false);
    const invalid = validate();
    setMessage(invalid);
    if (invalid) return;
    // 등록 즉시 모든 접속 유저에게 방송되고 수정·삭제가 없으므로 한 번 더 확인한다.
    if (
      !confirm(
        "공지를 등록하면 접속 중인 모든 유저에게 바로 전송되고, 수정·삭제할 수 없습니다. 등록할까요?",
      )
    )
      return;
    setBusy(true);
    try {
      onCreated(
        await createNotice({ title: title.trim(), content: content.trim() }),
      );
      setSent(true);
      setTitle("");
      setContent("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "등록에 실패했습니다.");
    }
    setBusy(false);
  };

  const counter = (length: number, max: number) => (
    <span className={cx("count", { over: length > max })}>
      {length} / {max}
    </span>
  );

  return (
    <form className={cx("card")} onSubmit={handleSubmit}>
      <h2 className={cx("cardTitle")}>새 공지</h2>
      <p className={cx("warning")}>
        등록 즉시 접속 중인 유저에게 방송되며 수정·삭제할 수 없습니다. 공지는
        등록 {NOTICE_RETENTION_DAYS}일 뒤 서버에서 자동으로 삭제됩니다.
      </p>
      <label className={cx("field")}>
        <span className={cx("fieldLabel")}>
          제목 *{counter(title.trim().length, NOTICE_TITLE_MAX)}
        </span>
        <input
          className={cx("input")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={NOTICE_TITLE_MAX}
          placeholder="예: 정기 점검 안내"
        />
      </label>
      <label className={cx("field")}>
        <span className={cx("fieldLabel")}>
          내용 *{counter(content.trim().length, NOTICE_CONTENT_MAX)}
        </span>
        <textarea
          className={cx("input", "textarea")}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={NOTICE_CONTENT_MAX}
          placeholder="예: 오늘 03:00~05:00 서버 점검이 있습니다"
        />
      </label>
      <div className={cx("footer")}>
        {message ? (
          <p className={cx("inlineError")}>{message}</p>
        ) : (
          sent && <p className={cx("success")}>공지를 등록하고 방송했습니다.</p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "등록 중..." : "공지 등록"}
        </Button>
      </div>
    </form>
  );
}
