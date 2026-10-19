import { apiFetch, jsonRequest, throwIfFailed } from "./request";

const STAGE = "/api/admin/stage";
const REWARD = "/api/admin/stage-reward";

export interface Stage {
  stageId: number;
}

export interface StageRewardItem {
  itemId: string;
  finalAmount: number;
}

// 20웨이브 완료 보상 (스테이지마다 하나)
export interface StageReward {
  stageId: number;
  baseExp: number;
  threeStarBonusExp: number;
  finalCoin: number;
  items: StageRewardItem[];
}

export interface StageRewardRequest {
  baseExp: number;
  threeStarBonusExp: number;
  finalCoin: number;
  items: StageRewardItem[];
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
};

export const getStages = () => request<Stage[]>(`${STAGE}/list`);
export const getStage = (stageId: number) =>
  request<Stage>(`${STAGE}/${stageId}`);
export const createStage = (stageId: number) =>
  request<Stage>(STAGE, jsonRequest("POST", { stageId }));
export const deleteStage = (stageId: number) =>
  request<void>(`${STAGE}/${stageId}`, { method: "DELETE" });

export const getStageRewards = () => request<StageReward[]>(`${REWARD}/list`);
export const getStageReward = (stageId: number) =>
  request<StageReward>(`${REWARD}/${stageId}`);
export const createStageReward = (stageId: number, body: StageRewardRequest) =>
  request<StageReward>(`${REWARD}/${stageId}`, jsonRequest("POST", body));
export const updateStageReward = (stageId: number, body: StageRewardRequest) =>
  request<StageReward>(`${REWARD}/${stageId}`, jsonRequest("PUT", body));
export const deleteStageReward = (stageId: number) =>
  request<void>(`${REWARD}/${stageId}`, { method: "DELETE" });

// 별등급(1~3) 최초 클리어 보상
const RATING_REWARD = "/api/admin/stage-rating-reward";

export const STAGE_RATINGS = [1, 2, 3] as const;
export type StageRating = (typeof STAGE_RATINGS)[number];

// 별등급 보상은 공통 고정 보상 묶음(reward-definitions)을 연결한다.
export interface StageRatingReward {
  stageId: number;
  rating: StageRating;
  gold: number;
  items: Record<string, number>;
  rewardDefinitionId: number;
  rewardDefinitionVersion: number;
}

export interface StageRatingRewardRequest {
  rewardDefinitionId: number;
}

const ratingPath = (stageId: number, rating: StageRating) =>
  `${RATING_REWARD}/${stageId}/${rating}`;

export const getStageRatingRewards = (stageId: number) =>
  request<StageRatingReward[]>(`${RATING_REWARD}/${stageId}/list`);
export const getStageRatingReward = (stageId: number, rating: StageRating) =>
  request<StageRatingReward>(ratingPath(stageId, rating));
export const createStageRatingReward = (
  stageId: number,
  rating: StageRating,
  body: StageRatingRewardRequest,
) =>
  request<StageRatingReward>(
    ratingPath(stageId, rating),
    jsonRequest("POST", body),
  );
export const updateStageRatingReward = (
  stageId: number,
  rating: StageRating,
  body: StageRatingRewardRequest,
) =>
  request<StageRatingReward>(
    ratingPath(stageId, rating),
    jsonRequest("PUT", body),
  );
export const deleteStageRatingReward = (stageId: number, rating: StageRating) =>
  request<void>(ratingPath(stageId, rating), { method: "DELETE" });
