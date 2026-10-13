import { apiFetch, jsonRequest, throwIfFailed } from "./request";

export interface NamedRef {
  id: number;
  name: string;
}

export interface CardSummary {
  id: number;
  name: string;
  skillId: number;
  skillName: string;
  enabled: boolean;
  maxPickCount: number;
}

export interface CardEffect {
  id: number;
  sortOrder: number;
  kind: string;
  value: number;
  form?: string;
  trigger?: string;
  skillId?: number;
  skillName?: string;
  chance: number;
  damageScale: number;
  targetSkillId?: number;
  targetSkillName?: string;
  count: number;
  onlyForm?: string;
  excludeHit: boolean;
  interval?: number;
}

export interface CardEffectRequest {
  sortOrder: number;
  kind: string;
  value?: number;
  form?: string;
  trigger?: string;
  skillId?: number;
  chance?: number;
  damageScale?: number;
  target?: number;
  count?: number;
  onlyForm?: string;
  excludeHit?: boolean;
  interval?: number;
}

export interface CardVariant {
  id: number;
  minPermanentLevel: number;
  name: string;
  desc?: string;
  effects: CardEffect[];
}

export interface CardVariantRequest {
  minPermanentLevel: number;
  name: string;
  desc?: string;
}

export interface RequiredCardCount {
  id: number;
  requiredCard: NamedRef;
  skill?: NamedRef;
  count: number;
}

export interface RequiredCardCountRequest {
  requiredCardId: number;
  skillId?: number;
  count?: number;
}

export interface CardExclusion {
  id: number;
  excludingCard: NamedRef;
  skill?: NamedRef;
  belowPermanentLevel: number;
}

export interface CardExclusionRequest {
  excludingCardId: number;
  skillId?: number;
  belowPermanentLevel?: number;
}

export interface CardDetail {
  id: number;
  skill: NamedRef;
  name: string;
  desc?: string;
  maxPickCount: number;
  enabled: boolean;
  disabledReason?: string;
  minBattleLevel: number;
  minPermanentLevel: number;
  requiredCardCounts: RequiredCardCount[];
  exclusions: CardExclusion[];
  sharedId?: string;
  effects: CardEffect[];
  variants: CardVariant[];
}

export interface CardRequest {
  skillId: number;
  name: string;
  desc?: string;
  maxPickCount?: number;
  enabled?: boolean;
  disabledReason?: string;
  minBattleLevel?: number;
  minPermanentLevel?: number;
  sharedId?: string;
}

const CARDS = "/api/admin/cards";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await apiFetch(path, init);
  await throwIfFailed(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
};

const remove = (path: string) => request<void>(path, { method: "DELETE" });

export const getCards = () => request<CardSummary[]>(CARDS);
export const getCard = (cardId: number) =>
  request<CardDetail>(`${CARDS}/${cardId}`);
export const createCard = (body: CardRequest) =>
  request<CardDetail>(CARDS, jsonRequest("POST", body));
export const updateCard = (cardId: number, body: CardRequest) =>
  request<CardDetail>(`${CARDS}/${cardId}`, jsonRequest("PUT", body));
export const deleteCard = (cardId: number) => remove(`${CARDS}/${cardId}`);

export const createCardEffect = (cardId: number, body: CardEffectRequest) =>
  request<CardEffect>(`${CARDS}/${cardId}/effects`, jsonRequest("POST", body));
export const createVariantEffect = (
  variantId: number,
  body: CardEffectRequest,
) =>
  request<CardEffect>(
    `/api/admin/card-variants/${variantId}/effects`,
    jsonRequest("POST", body),
  );
export const updateCardEffect = (effectId: number, body: CardEffectRequest) =>
  request<CardEffect>(
    `/api/admin/card-effects/${effectId}`,
    jsonRequest("PUT", body),
  );
export const deleteCardEffect = (effectId: number) =>
  remove(`/api/admin/card-effects/${effectId}`);

export const createVariant = (cardId: number, body: CardVariantRequest) =>
  request<CardVariant>(
    `${CARDS}/${cardId}/variants`,
    jsonRequest("POST", body),
  );
export const updateVariant = (variantId: number, body: CardVariantRequest) =>
  request<CardVariant>(
    `/api/admin/card-variants/${variantId}`,
    jsonRequest("PUT", body),
  );
export const deleteVariant = (variantId: number) =>
  remove(`/api/admin/card-variants/${variantId}`);

export const createRequiredCardCount = (
  cardId: number,
  body: RequiredCardCountRequest,
) =>
  request<RequiredCardCount>(
    `${CARDS}/${cardId}/required-card-counts`,
    jsonRequest("POST", body),
  );
export const deleteRequiredCardCount = (id: number) =>
  remove(`/api/admin/required-card-counts/${id}`);

export const createExclusion = (cardId: number, body: CardExclusionRequest) =>
  request<CardExclusion>(
    `${CARDS}/${cardId}/exclusions`,
    jsonRequest("POST", body),
  );
export const deleteExclusion = (id: number) =>
  remove(`/api/admin/card-exclusions/${id}`);

