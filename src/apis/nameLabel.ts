import { jsonRequest, throwIfFailed } from "./request";

// "이름(name) + 표시 이름(label)" 형태의 공통 API
export interface NameLabelItem {
  id: number;
  name: string;
  label: string;
  updatedAt: string;
}

export interface NameLabelRequest {
  name: string;
  label: string;
}

export interface NameLabelApi {
  getAll: () => Promise<NameLabelItem[]>;
  create: (body: NameLabelRequest) => Promise<NameLabelItem>;
  update: (id: number, body: NameLabelRequest) => Promise<NameLabelItem>;
  remove: (id: number) => Promise<void>;
}

export const createNameLabelApi = (basePath: string): NameLabelApi => ({
  getAll: async () => {
    const response = await fetch(basePath);
    await throwIfFailed(response);
    return response.json();
  },
  create: async (body) => {
    const response = await fetch(basePath, jsonRequest("POST", body));
    await throwIfFailed(response);
    return response.json();
  },
  update: async (id, body) => {
    const response = await fetch(`${basePath}/${id}`, jsonRequest("PUT", body));
    await throwIfFailed(response);
    return response.json();
  },
  remove: async (id) => {
    const response = await fetch(`${basePath}/${id}`, { method: "DELETE" });
    await throwIfFailed(response);
  },
});
