"use client";

import { useEffect, useRef, useState } from "react";
import classnames from "classnames/bind";
import s from "../notice.module.scss";
import Button from "@/components/common/Button";
import { subscribeNotifications } from "@/apis/notification";
import type { Notice } from "@/apis/notice";

const cx = classnames.bind(s);

type Status = "idle" | "connecting" | "connected";

interface Received {
  id: number;
  at: Date;
  event: string;
  text: string;
}

const STATUS_LABEL: Record<Status, string> = {
  idle: "구독 안 함",
  connecting: "연결 중",
  connected: "수신 중",
};

const MAX_EVENTS = 50;
let seq = 0;

const time = (date: Date) =>
  date.toLocaleTimeString("ko-KR", { hour12: false });

interface LiveReceiverProps {
  onNotice: (notice: Notice) => void;
}

// 게임 클라이언트처럼 SSE를 구독해, 등록한 공지가 실제로 방송되는지 확인한다.
export default function LiveReceiver({ onNotice }: LiveReceiverProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [events, setEvents] = useState<Received[]>([]);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const onNoticeRef = useRef(onNotice);

  useEffect(() => {
    onNoticeRef.current = onNotice;
  }, [onNotice]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const push = (event: string, text: string) =>
    setEvents((prev) =>
      [{ id: ++seq, at: new Date(), event, text }, ...prev].slice(
        0,
        MAX_EVENTS,
      ),
    );

  const connect = async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("connecting");
    try {
      await subscribeNotifications(({ event, data }) => {
        if (event === "ping") return setLastPing(new Date());
        if (event === "connect") {
          setStatus("connected");
          return push(event, "연결되었습니다.");
        }
        if (event === "notice") {
          try {
            const notice = JSON.parse(data) as Notice;
            onNoticeRef.current(notice);
            return push(event, `[#${notice.id}] ${notice.title}`);
          } catch {
            return push(event, data);
          }
        }
        push(event, data);
      }, controller.signal);
      push("close", "서버가 연결을 종료했습니다.");
    } catch (e) {
      if (!controller.signal.aborted)
        push("error", e instanceof Error ? e.message : "연결에 실패했습니다.");
    }
    if (controllerRef.current === controller) {
      controllerRef.current = null;
      setStatus("idle");
    }
  };

  const disconnect = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    push("close", "구독을 끊었습니다.");
  };

  return (
    <section className={cx("card")}>
      <div className={cx("header")}>
        <h2 className={cx("cardTitle")}>
          실시간 수신 확인
          <span className={cx("status", status)}>{STATUS_LABEL[status]}</span>
        </h2>
        {status === "idle" ? (
          <Button size="small" variant="outline" onClick={connect}>
            구독 시작
          </Button>
        ) : (
          <Button size="small" variant="outline" onClick={disconnect}>
            구독 끊기
          </Button>
        )}
      </div>
      <p className={cx("hint", "block")}>
        현재 로그인한 계정으로 /api/notifications/subscribe 를 구독합니다.
        공지를 등록하면 아래에 notice 이벤트가 표시됩니다.
        {lastPing && ` · 마지막 하트비트 ${time(lastPing)}`}
      </p>
      {events.length === 0 ? (
        <p className={cx("empty")}>받은 이벤트가 없습니다.</p>
      ) : (
        <ul className={cx("events")}>
          {events.map((item) => (
            <li key={item.id} className={cx("eventRow")}>
              <span className={cx("meta")}>{time(item.at)}</span>
              <span className={cx("eventName", item.event)}>{item.event}</span>
              <span className={cx("eventText")}>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
