import { apiFetch, jsonRequest, throwIfFailed } from "./request";

export const MAIL_TITLE_MAX = 100;
export const MAIL_CONTENT_MAX = 1000;
export const MAIL_RETENTION_DAYS = 30;
export const USER_SEARCH_SIZE = 20;

export interface MailItem {
  itemId: string;
  targetId?: string | null;
  quantity: number;
}

// 우편 보상 재화 (수령하면 아이템과 함께 지급)
export const MAIL_CURRENCIES = [
  { key: "exp", label: "경험치" },
  { key: "gold", label: "골드" },
  { key: "gem", label: "젬" },
  { key: "energy", label: "에너지" },
] as const;
export type MailCurrency = (typeof MAIL_CURRENCIES)[number]["key"];
export type MailCurrencies = Record<MailCurrency, number>;

export interface Mail extends MailCurrencies {
  id: number;
  userId?: number; // 받는 유저
  title: string;
  content: string;
  claimed: boolean;
  items: MailItem[];
  createdAt: string; // 서버 UTC ISO8601
}

// 우편 본문 (받는 사람 제외)
export interface MailContent extends MailCurrencies {
  title: string;
  content: string;
  items: { itemId: string; quantity: number }[];
}

export interface MailRequest extends MailContent {
  userId: number;
}

// 다중·전체 발송은 서버가 골드만 받는다.
export interface BroadcastMailRequest {
  title: string;
  content: string;
  gold: number;
  items: { itemId: string; quantity: number }[];
}

export interface BulkMailRequest extends BroadcastMailRequest {
  userIds: number[];
}

// 다중·전체 발송에서 쓸 수 있는 재화
export const BULK_CURRENCIES: MailCurrency[] = ["gold"];

export interface BulkMailResponse {
  sentCount: number;
}

export interface UserSummary {
  userId: number;
  nickname: string | null;
}

// 서버에 아직 없는 API(404·405)를 구분하기 위한 에러
export class ApiNotReadyError extends Error {
  constructor(path: string) {
    super(`서버에 아직 없는 기능입니다 (${path})`);
    this.name = "ApiNotReadyError";
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  if (response.status === 404 || response.status === 405) {
    // 404여도 서버가 보낸 업무 오류(존재하지 않는 유저 등)면 그 메시지를 쓴다.
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    if (!data?.message || response.status === 405)
      throw new ApiNotReadyError(
        `${init?.method ?? "GET"} ${path.split("?")[0]}`,
      );
  }
  await throwIfFailed(response);
  return (await response.json()) as T;
};

// 한 유저에게 발송. 접속 중이면 SSE(mail 이벤트)로 즉시 전달된다. 수정·회수 API는 없다.
// 우편은 수령 여부와 상관없이 30일 뒤 서버에서 자동 삭제된다.
export const sendMail = (body: MailRequest) =>
  request<Mail>("/api/admin/mails", jsonRequest("POST", body));

// 여러 유저에게 같은 우편 발송. 없는 userId는 서버가 건너뛰고 실제 발송 수를 돌려준다.
// 서버의 다중·전체 발송 요청은 재화 중 골드만 받는다(경험치·젬·에너지 없음).
export const sendBulkMail = (body: BulkMailRequest) =>
  request<BulkMailResponse>("/api/admin/mails/bulk", jsonRequest("POST", body));

// 전체 유저에게 같은 우편 발송 (골드만 지원)
export const sendBroadcastMail = (body: BroadcastMailRequest) =>
  request<BulkMailResponse>(
    "/api/admin/mails/broadcast",
    jsonRequest("POST", body),
  );

// 특정 유저의 우편함 (최신순)
export const getUserMails = (userId: number) =>
  request<Mail[]>(`/api/admin/mails?userId=${userId}`);

// 닉네임 부분 일치 검색. keyword가 비면 최근 가입순
export const searchUsers = (keyword: string) =>
  request<UserSummary[]>(
    `/api/admin/users?keyword=${encodeURIComponent(keyword.trim())}&size=${USER_SEARCH_SIZE}`,
  );
