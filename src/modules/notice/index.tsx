"use client";

import { useCallback, useEffect, useState } from "react";
import classnames from "classnames/bind";
import s from "./notice.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import NoticeForm from "./components/noticeForm";
import LiveReceiver from "./components/liveReceiver";
import {
  NOTICE_RECENT_LIMIT,
  NOTICE_RETENTION_DAYS,
  getRecentNotices,
  type Notice,
} from "@/apis/notice";

const cx = classnames.bind(s);

const formatDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString("ko-KR", { hour12: false });
};

const DAY_MS = 24 * 60 * 60 * 1000;

// 자동 삭제까지 남은 일수 (등록 후 7일)
const daysLeft = (iso: string) => {
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return null;
  return Math.max(
    0,
    Math.ceil((created + NOTICE_RETENTION_DAYS * DAY_MS - Date.now()) / DAY_MS),
  );
};

export default function NoticeManager() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  useEffect(() => {
    let ignore = false;
    getRecentNotices()
      .then((data) => {
        if (ignore) return;
        setNotices(data);
        setLoadError(null);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "공지를 불러오지 못했습니다.",
          );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [version]);

  // 등록 응답과 SSE 방송이 모두 오므로 id로 중복을 막는다.
  const addNotice = useCallback((notice: Notice) => {
    setNotices((prev) =>
      prev.some((n) => n.id === notice.id)
        ? prev
        : [notice, ...prev].slice(0, NOTICE_RECENT_LIMIT),
    );
    setHighlightId(notice.id);
  }, []);

  return (
    <>
      <Title
        title="공지 관리"
        subtitle="등록한 공지는 접속 중인 모든 유저에게 실시간(SSE)으로 전송됩니다"
        align="left"
      />

      <NoticeForm onCreated={addNotice} />
      <LiveReceiver onNotice={addNotice} />

      <section className={cx("card")}>
        <div className={cx("header")}>
          <h2 className={cx("cardTitle")}>
            최근 공지
            <span className={cx("hint")}>
              최신순 최대 {NOTICE_RECENT_LIMIT}개 · {NOTICE_RETENTION_DAYS}일
              지나면 자동 삭제
            </span>
          </h2>
          <Button
            size="small"
            variant="outline"
            onClick={() => {
              setLoading(true);
              setVersion((v) => v + 1);
            }}
            disabled={loading}
          >
            새로고침
          </Button>
        </div>

        {loadError && <p className={cx("error")}>{loadError}</p>}

        {loading ? (
          <p className={cx("empty")}>불러오는 중...</p>
        ) : notices.length === 0 ? (
          !loadError && <p className={cx("empty")}>등록된 공지가 없습니다.</p>
        ) : (
          <div className={cx("list")}>
            {notices.map((notice) => {
              const left = daysLeft(notice.createdAt);
              return (
                <article key={notice.id} className={cx("item")}>
                  <div className={cx("itemHead")}>
                    <span className={cx("itemTitle")}>{notice.title}</span>
                    {notice.id === highlightId && (
                      <span className={cx("new")}>방금 등록</span>
                    )}
                    <span className={cx("meta")}>
                      #{notice.id} · {formatDate(notice.createdAt)}
                      {left != null &&
                        ` · ${left === 0 ? "곧 삭제" : `${left}일 후 삭제`}`}
                    </span>
                  </div>
                  <p className={cx("itemContent")}>{notice.content}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
