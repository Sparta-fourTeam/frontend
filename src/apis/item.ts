import { apiFetch, jsonRequest, throwIfFailed } from "./request";

const BASE = "/api/admin/item";

// targetId가 있으면 스킬 재료(값은 스킬 id), 없으면 장비(강화) 재료
export interface Item {
  itemId: string;
  targetId?: string;
}

export interface ItemRequest {
  targetId?: string;
}

export interface ItemCreateRequest extends ItemRequest {
  itemId: string;
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
};

const path = (itemId: string) => `${BASE}/${encodeURIComponent(itemId)}`;

export const getItems = () => request<Item[]>(`${BASE}/list`);
export const getItem = (itemId: string) => request<Item>(path(itemId));
export const createItem = (body: ItemCreateRequest) =>
  request<Item>(BASE, jsonRequest("POST", body));
export const updateItem = (itemId: string, body: ItemRequest) =>
  request<Item>(path(itemId), jsonRequest("PUT", body));
export const deleteItem = (itemId: string) =>
  request<void>(path(itemId), { method: "DELETE" });
