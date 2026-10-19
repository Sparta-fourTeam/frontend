import { apiFetch, jsonRequest, throwIfFailed } from "./request";

export const REWARD_KINDS = [
  "Coin",
  "SkillMaterial",
  "EquipmentMaterial",
  "GemChest",
] as const;
export type RewardKind = (typeof REWARD_KINDS)[number];
// 아이템 분류에 쓸 수 있는 종류 (Coin은 일정 전용)
export type RewardItemKind = Exclude<RewardKind, "Coin">;

export const WAVE_COUNT = 20;

// 웨이브 진행에 따른 지급 일정
export interface RewardSchedule {
  start: number; // 참가 시 기본량 (0웨이브에도 지급)
  perWave: number; // 완료 웨이브당 증가량
  bonusWave: number; // 총량과 기본 누적의 차액을 지급할 웨이브 (1~20)
}

export interface RewardItemRule {
  kind: RewardItemKind;
  random: boolean; // true면 실제 아이템이 아닌 랜덤 추첨 ID
}

export interface RewardRulesData {
  schedules: Record<RewardKind, RewardSchedule>;
  items: Record<string, RewardItemRule>;
}

export interface RewardRules extends RewardRulesData {
  version: number;
}

// 20웨이브를 모두 완료했을 때의 기본 누적량 = 스테이지 총량의 최소값
export const minimumFinal = (schedule: RewardSchedule) =>
  schedule.start + schedule.perWave * WAVE_COUNT;

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (await response.json()) as T;
};

// 미설정이면 서버가 503을 돌려준다 → null
export const getRewardRules = async (): Promise<RewardRules | null> => {
  const response = await apiFetch("/api/reward-rules");
  if (response.status === 503) return null;
  await throwIfFailed(response);
  return response.json();
};

export const saveRewardRules = (body: RewardRulesData) =>
  request<RewardRules>("/api/admin/reward-rules", jsonRequest("PUT", body));
