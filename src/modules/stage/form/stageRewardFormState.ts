import type { StageReward, StageRewardRequest } from "@/apis/stage";

// 서버 검증 규칙과 맞춘 값
export const MIN_FINAL_COIN = 125;
export const SKILL_MATERIAL_PREFIX = "material.skill";
export const SKILL_MATERIAL_MIN_AMOUNT = 21;

export interface RewardItemDraft {
  key: string;
  itemId: string;
  finalAmount: string;
}

export interface StageRewardFormState {
  baseExp: string;
  threeStarBonusExp: string;
  finalCoin: string;
  items: RewardItemDraft[];
}

let seq = 0;
const newKey = () => `reward-item-${++seq}`;

export const emptyRewardItem = (): RewardItemDraft => ({
  key: newKey(),
  itemId: "",
  finalAmount: "",
});

const str = (v: number | null | undefined) => (v == null ? "" : String(v));

export const toFormState = (reward?: StageReward): StageRewardFormState => ({
  baseExp: str(reward?.baseExp),
  threeStarBonusExp: str(reward?.threeStarBonusExp),
  finalCoin: str(reward?.finalCoin),
  items: (reward?.items ?? []).map((item) => ({
    key: newKey(),
    itemId: item.itemId,
    finalAmount: String(item.finalAmount),
  })),
});

const isInt = (value: string) => /^\d+$/.test(value.trim());

export const validateReward = (form: StageRewardFormState): string | null => {
  if (!isInt(form.baseExp)) return "baseExp는 0 이상의 정수입니다.";
  if (!isInt(form.threeStarBonusExp))
    return "threeStarBonusExp는 0 이상의 정수입니다.";
  if (!isInt(form.finalCoin) || Number(form.finalCoin) < MIN_FINAL_COIN)
    return `finalCoin은 ${MIN_FINAL_COIN} 이상의 정수입니다.`;

  const seen = new Set<string>();
  for (const [i, item] of form.items.entries()) {
    const label = `보상 아이템 ${i + 1}`;
    if (!item.itemId) return `${label}: 아이템을 선택하세요.`;
    if (seen.has(item.itemId))
      return `${label}: ${item.itemId}이(가) 중복됩니다.`;
    seen.add(item.itemId);
    if (!isInt(item.finalAmount))
      return `${label}: 수량은 0 이상의 정수입니다.`;
    if (
      item.itemId.startsWith(SKILL_MATERIAL_PREFIX) &&
      Number(item.finalAmount) < SKILL_MATERIAL_MIN_AMOUNT
    )
      return `${label}: 스킬 재료는 ${SKILL_MATERIAL_MIN_AMOUNT}개 이상이어야 합니다.`;
  }
  return null;
};

export const toRequest = (form: StageRewardFormState): StageRewardRequest => ({
  baseExp: Number(form.baseExp),
  threeStarBonusExp: Number(form.threeStarBonusExp),
  finalCoin: Number(form.finalCoin),
  items: form.items.map((item) => ({
    itemId: item.itemId,
    finalAmount: Number(item.finalAmount),
  })),
});
