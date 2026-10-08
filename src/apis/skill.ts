import { jsonRequest, throwIfFailed } from "./request";
import type { StatGroupKey } from "@/constants/skillStats";

const BASE = "/api/skill";

export type StatGroupValues = Record<string, number>;

export type SkillBaseStats = Partial<Record<StatGroupKey, StatGroupValues>>;

export interface SkillSummary {
  id: number;
  name: string;
  castType: string;
  projectilePath: string;
  statGroups?: StatGroupKey[];
}

export interface SkillDetail {
  id: number;
  name: string;
  desc?: string;
  castType: { id: number; name: string };
  projectilePath: { id: number; name: string };
  maxLevel: number;
  childOnly: boolean;
  baseStats?: SkillBaseStats;
  unlockLevel: number;
}

export interface SkillRequest {
  name: string;
  desc?: string;
  castTypeId: number;
  projectilePathId: number;
  maxLevel: number;
  childOnly: boolean;
  baseStats: SkillBaseStats;
  unlockLevel?: number;
}

export const getSkills = async (): Promise<SkillSummary[]> => {
  const response = await fetch(`${BASE}/list`);
  await throwIfFailed(response);
  return response.json();
};

export const getSkill = async (id: number | string): Promise<SkillDetail> => {
  const response = await fetch(`${BASE}/${id}`);
  await throwIfFailed(response);
  return response.json();
};

export const createSkill = async (body: SkillRequest): Promise<SkillDetail> => {
  const response = await fetch(BASE, jsonRequest("POST", body));
  await throwIfFailed(response);
  return response.json();
};

export const updateSkill = async (id: number | string, body: SkillRequest): Promise<SkillDetail> => {
  const response = await fetch(`${BASE}/${id}`, jsonRequest("PUT", body));
  await throwIfFailed(response);
  return response.json();
};

export const deleteSkill = async (id: number | string): Promise<void> => {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  await throwIfFailed(response);
};
