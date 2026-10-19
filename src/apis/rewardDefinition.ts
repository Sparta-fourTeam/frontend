import { apiFetch, jsonRequest, throwIfFailed } from "./request";

const BASE = "/api/admin/reward-definitions";

// 고정 골드 + 실제 아이템 수량으로 된 공통 보상 묶음 (별등급·튜토리얼·퀘스트·상점·도감에서 참조)
export interface RewardDefinition {
  id: number;
  name: string;
  version: number;
  gold: number;
  items: Record<string, number>;
  ratingReferences: number;
  tutorialReferences: number;
  questChestReferences: number;
  shopReferences: number;
  codexGradeReferences: number;
}

export interface RewardDefinitionRequest {
  name: string;
  gold: number;
  items: Record<string, number>;
  // 수정(PUT) 때 필수: 조회한 현재 버전. 다르면 409
  expectedVersion?: number;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
};

export const getRewardDefinitions = () => request<RewardDefinition[]>(BASE);
export const getRewardDefinition = (id: number) =>
  request<RewardDefinition>(`${BASE}/${id}`);
export const createRewardDefinition = (body: RewardDefinitionRequest) =>
  request<RewardDefinition>(BASE, jsonRequest("POST", body));
export const updateRewardDefinition = (
  id: number,
  body: RewardDefinitionRequest,
) => request<RewardDefinition>(`${BASE}/${id}`, jsonRequest("PUT", body));
export const deleteRewardDefinition = (id: number) =>
  request<void>(`${BASE}/${id}`, { method: "DELETE" });

// 참조 위치별 개수 (0이 아닌 것만)
export const REFERENCE_LABELS: {
  key: keyof Pick<
    RewardDefinition,
    | "ratingReferences"
    | "tutorialReferences"
    | "questChestReferences"
    | "shopReferences"
    | "codexGradeReferences"
  >;
  label: string;
}[] = [
  { key: "ratingReferences", label: "별등급" },
  { key: "tutorialReferences", label: "튜토리얼" },
  { key: "questChestReferences", label: "퀘스트 상자" },
  { key: "shopReferences", label: "상점" },
  { key: "codexGradeReferences", label: "도감 등급" },
];

export const referenceCount = (definition: RewardDefinition) =>
  REFERENCE_LABELS.reduce((sum, { key }) => sum + definition[key], 0);
