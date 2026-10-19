import { apiFetch, throwIfFailed } from "./request";

// 서버 SSE(/api/notifications/subscribe) 이벤트
// connect: 연결 직후 1회, ping: 30초마다, notice: 공지 방송, forceLogout: 다른 기기 로그인으로 종료
export interface ServerEvent {
  event: string;
  data: string;
}

// 브라우저 EventSource는 Authorization 헤더를 못 붙이므로 fetch 스트림으로 직접 읽는다.
export const subscribeNotifications = async (
  onEvent: (event: ServerEvent) => void,
  signal: AbortSignal,
) => {
  const response = await apiFetch("/api/notifications/subscribe", {
    headers: { Accept: "text/event-stream" },
    cache: "no-store",
    signal,
  });
  await throwIfFailed(response);
  if (!response.body) throw new Error("스트림을 읽을 수 없습니다.");

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value.replace(/\r\n?/g, "\n");
    // 빈 줄로 이벤트가 구분된다.
    let end = buffer.indexOf("\n\n");
    while (end >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      end = buffer.indexOf("\n\n");

      let event = "message";
      const data: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:"))
          data.push(line.slice(5).replace(/^ /, ""));
      }
      if (data.length) onEvent({ event, data: data.join("\n") });
    }
  }
};
