import {
  toRewardItemDrafts,
  validateRewardItemDrafts,
  type RewardItemDraft,
} from "@/components/common/RewardItemsEditor";
import { minimumFinal, type RewardRules } from "@/apis/rewardRules";
import type { StageReward, StageRewardRequest } from "@/apis/stage";

export interface StageRewardFormState {
  baseExp: string;
  threeStarBonusExp: string;
  finalCoin: string;
  items: RewardItemDraft[];
}

const str = (v: number | null | undefined) => (v == null ? "" : String(v));
const isInt = (value: string) => /^\d+$/.test(value.trim());

export const toFormState = (reward?: StageReward): StageRewardFormState => ({
  baseExp: str(reward?.baseExp),
  threeStarBonusExp: str(reward?.threeStarBonusExp),
  finalCoin: str(reward?.finalCoin),
  items: toRewardItemDrafts(
    (reward?.items ?? []).map((item) => ({
      itemId: item.itemId,
      amount: item.finalAmount,
    })),
  ),
});

// 보상 기준(reward-rules)으로 정해지는 최소 총량. 기준이 없으면 0
export const minCoin = (rules: RewardRules | null) =>
  rules ? minimumFinal(rules.schedules.Coin) : 0;

export const minItemAmount = (rules: RewardRules | null, itemId: string) => {
  const rule = rules?.items[itemId];
  return rules && rule ? minimumFinal(rules.schedules[rule.kind]) : 0;
};

export const validateReward = (
  form: StageRewardFormState,
  rules: RewardRules | null,
): string | null => {
  if (!rules)
    return "보상 기준이 설정되지 않아 저장할 수 없습니다. 보상 기준을 먼저 등록하세요.";
  if (!isInt(form.baseExp)) return "baseExp는 0 이상의 정수입니다.";
  if (!isInt(form.threeStarBonusExp))
    return "threeStarBonusExp는 0 이상의 정수입니다.";
  if (!isInt(form.finalCoin) || Number(form.finalCoin) < minCoin(rules))
    return `finalCoin은 ${minCoin(rules)} 이상의 정수입니다(보상 기준 코인 최소 총량).`;
  return validateRewardItemDrafts(
    form.items,
    (itemId) => minItemAmount(rules, itemId),
    (itemId) => !!rules.items[itemId],
  );
};

export const toRequest = (form: StageRewardFormState): StageRewardRequest => ({
  baseExp: Number(form.baseExp),
  threeStarBonusExp: Number(form.threeStarBonusExp),
  finalCoin: Number(form.finalCoin),
  items: form.items.map((item) => ({
    itemId: item.itemId,
    finalAmount: Number(item.amount),
  })),
});
