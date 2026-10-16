import { apiFetch, jsonRequest, throwIfFailed } from "./request";

const BASE = "/api/admin/upgrade";

// valuePerLevel(레벨당 증가값)과 levelValues(레벨별 값) 중 하나만 사용
export interface UpgradeEffect {
  kind: string;
  valuePerLevel?: number | null;
  levelValues?: number[] | null;
}

export interface Upgrade {
  upgradeId: string;
  maxLevel: number;
  unlockLevel: number;
  materialItemId?: string;
  costBase?: number;
  costStep?: number;
  materialBase?: number;
  materialStep?: number;
  effects?: UpgradeEffect[];
}

export interface UpgradeRequest {
  maxLevel: number;
  unlockLevel?: number;
  materialItemId?: string;
  costBase?: number;
  costStep?: number;
  materialBase?: number;
  materialStep?: number;
  effects?: UpgradeEffect[];
}

export interface UpgradeCreateRequest extends UpgradeRequest {
  upgradeId: string;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
};

const path = (upgradeId: string) => `${BASE}/${encodeURIComponent(upgradeId)}`;

export const getUpgrades = () => request<Upgrade[]>(`${BASE}/list`);
export const getUpgrade = (upgradeId: string) =>
  request<Upgrade>(path(upgradeId));
export const createUpgrade = (body: UpgradeCreateRequest) =>
  request<Upgrade>(BASE, jsonRequest("POST", body));
export const updateUpgrade = (upgradeId: string, body: UpgradeRequest) =>
  request<Upgrade>(path(upgradeId), jsonRequest("PUT", body));
export const deleteUpgrade = (upgradeId: string) =>
  request<void>(path(upgradeId), { method: "DELETE" });
