import { apiFetch, jsonRequest, throwIfFailed } from "./request";

export const NOTICE_TITLE_MAX = 100;
export const NOTICE_CONTENT_MAX = 1000;
export const NOTICE_RECENT_LIMIT = 20;
export const NOTICE_RETENTION_DAYS = 7;

export interface Notice {
  id: number;
  title: string;
  content: string;
  createdAt: string; // 서버 UTC ISO8601
}

export interface NoticeRequest {
  title: string;
  content: string;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (await response.json()) as T;
};

// 최근 20개, 최신순 (등록 7일이 지난 공지는 서버가 매일 자동 삭제)
export const getRecentNotices = () => request<Notice[]>("/api/notices/recent");

// 등록 즉시 접속 중인 모든 유저에게 SSE(notice 이벤트)로 방송된다. 수정·삭제 API는 없다.
export const createNotice = (body: NoticeRequest) =>
  request<Notice>("/api/admin/notices", jsonRequest("POST", body));
