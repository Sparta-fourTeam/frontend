import { apiFetch, jsonRequest, throwIfFailed } from "./request";

const BASE = "/api/admin/skill";

export type StatGroupValues = Record<string, number>;

export type SkillBaseStats = Record<string, StatGroupValues>;

export interface SkillSummary {
  id: number;
  name: string;
  castType: string;
  projectilePath: string;
  element?: string | null;
  statGroups?: string[];
}

export interface SkillDetail {
  id: number;
  name: string;
  desc?: string;
  castType: { id: number; name: string };
  projectilePath: { id: number; name: string };
  element?: { id: number; name: string };
  maxLevel: number;
  childOnly: boolean;
  baseStats?: SkillBaseStats;
  unlockLevel: number;
  progressionId?: string;
}

export interface SkillRequest {
  name: string;
  desc?: string;
  castTypeId: number;
  projectilePathId: number;
  elementId?: number;
  maxLevel: number;
  childOnly: boolean;
  baseStats: SkillBaseStats;
  unlockLevel?: number;
  progressionId?: string;
}

export const getSkills = async (): Promise<SkillSummary[]> => {
  const response = await apiFetch(`${BASE}/list`);
  await throwIfFailed(response);
  return response.json();
};

export const getSkill = async (id: number | string): Promise<SkillDetail> => {
  const response = await apiFetch(`${BASE}/${id}`);
  await throwIfFailed(response);
  return response.json();
};

export const createSkill = async (body: SkillRequest): Promise<SkillDetail> => {
  const response = await apiFetch(BASE, jsonRequest("POST", body));
  await throwIfFailed(response);
  return response.json();
};

export const updateSkill = async (
  id: number | string,
  body: SkillRequest,
): Promise<SkillDetail> => {
  const response = await apiFetch(`${BASE}/${id}`, jsonRequest("PUT", body));
  await throwIfFailed(response);
  return response.json();
};

export const deleteSkill = async (id: number | string): Promise<void> => {
  const response = await apiFetch(`${BASE}/${id}`, { method: "DELETE" });
  await throwIfFailed(response);
};
