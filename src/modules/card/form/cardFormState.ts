import type { CardDetail, CardRequest } from "@/apis/card";
import type { VariantDraft } from "./components/variantListEditor";
import {
  effectToDraft,
  newKey,
  validateEffect,
  type EffectDraft,
} from "./effectDraft";

export interface CardFormState {
  skillId: string;
  name: string;
  desc: string;
  maxPickCount: string;
  enabled: boolean;
  disabledReason: string;
  minBattleLevel: string;
  minPermanentLevel: string;
  sharedId: string;
  effects: EffectDraft[];
  variants: VariantDraft[];
}

export interface CardFormValue {
  request: CardRequest;
  effects: EffectDraft[];
  variants: VariantDraft[];
}

const str = (v: number | string | null | undefined) =>
  v == null ? "" : String(v);

export const toFormState = (card?: CardDetail): CardFormState => ({
  skillId: str(card?.skill.id),
  name: card?.name ?? "",
  desc: card?.desc ?? "",
  maxPickCount: str(card?.maxPickCount),
  enabled: card?.enabled ?? true,
  disabledReason: card?.disabledReason ?? "",
  minBattleLevel: str(card?.minBattleLevel),
  minPermanentLevel: str(card?.minPermanentLevel),
  sharedId: card?.sharedId ?? "",
  effects: (card?.effects ?? []).map(effectToDraft),
  variants: (card?.variants ?? []).map((v) => ({
    key: newKey(),
    id: v.id,
    minPermanentLevel: String(v.minPermanentLevel),
    name: v.name,
    desc: v.desc ?? "",
    effects: v.effects.map(effectToDraft),
  })),
});

const text = (value: string) =>
  value.trim() === "" ? undefined : value.trim();
const num = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

export const validateCard = (form: CardFormState): string | null => {
  const maxPickCount = num(form.maxPickCount);
  const minBattleLevel = num(form.minBattleLevel);
  const minPermanentLevel = num(form.minPermanentLevel);
  if (maxPickCount !== undefined && !(maxPickCount >= 1))
    return "최대 선택 횟수는 1 이상입니다.";
  if (minBattleLevel !== undefined && !(minBattleLevel >= 1))
    return "최소 전투 레벨은 1 이상입니다.";
  if (minPermanentLevel !== undefined && !(minPermanentLevel >= 0))
    return "최소 영구 레벨은 0 이상입니다.";

  for (const [i, effect] of form.effects.entries()) {
    const message = validateEffect(effect, `기본 효과 ${i + 1}`);
    if (message) return message;
  }

  const levels = new Set<number>();
  for (const [i, variant] of form.variants.entries()) {
    const label = `변형 ${i + 1}`;
    const level = Number(variant.minPermanentLevel);
    if (!(Number.isInteger(level) && level > 0))
      return `${label}: minPermanentLevel은 0보다 커야 합니다.`;
    if (levels.has(level))
      return `${label}: minPermanentLevel ${level}이(가) 중복됩니다.`;
    levels.add(level);
    if (!variant.name.trim()) return `${label}: 이름을 입력하세요.`;
    for (const [j, effect] of variant.effects.entries()) {
      const message = validateEffect(effect, `${label} 효과 ${j + 1}`);
      if (message) return message;
    }
  }
  return null;
};

export const toFormValue = (form: CardFormState): CardFormValue => {
  return {
    request: {
      skillId: Number(form.skillId),
      name: form.name.trim(),
      desc: text(form.desc),
      maxPickCount: num(form.maxPickCount),
      enabled: form.enabled,
      disabledReason: form.enabled ? undefined : text(form.disabledReason),
      minBattleLevel: num(form.minBattleLevel),
      minPermanentLevel: num(form.minPermanentLevel),
      sharedId: text(form.sharedId),
    },
    effects: form.effects,
    variants: form.variants,
  };
};
