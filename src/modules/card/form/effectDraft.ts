import type { CardEffect, CardEffectRequest } from "@/apis/card";

export type EffectParam =
  | "value"
  | "form"
  | "trigger"
  | "skillId"
  | "chance"
  | "damageScale"
  | "target"
  | "count"
  | "onlyForm"
  | "excludeHit"
  | "interval";

export type ParamType =
  "number" | "int" | "skill" | "form" | "trigger" | "bool";

export const EFFECT_PARAMS: {
  key: EffectParam;
  type: ParamType;
  hint: string;
}[] = [
  { key: "value", type: "number", hint: "생략 0" },
  { key: "form", type: "form", hint: "형태" },
  { key: "trigger", type: "trigger", hint: "생략 Start" },
  { key: "skillId", type: "skill", hint: "자식 스킬" },
  { key: "chance", type: "number", hint: "0~1 · 생략 1" },
  { key: "damageScale", type: "number", hint: "생략 1" },
  { key: "target", type: "skill", hint: "생략 본체" },
  { key: "count", type: "int", hint: "생략 1" },
  { key: "onlyForm", type: "form", hint: "이 형태만" },
  { key: "excludeHit", type: "bool", hint: "맞은 적 제외" },
  { key: "interval", type: "number", hint: "초" },
];

const NUMERIC: EffectParam[] = [
  "value",
  "chance",
  "damageScale",
  "count",
  "interval",
];

export interface EffectDraft {
  key: string;
  id?: number;
  kind: string;
  params: EffectParam[];
  values: Partial<Record<EffectParam, string>>;
  excludeHit: boolean;
}

let seq = 0;
export const newKey = () => `draft-${++seq}`;

export const emptyEffect = (): EffectDraft => ({
  key: newKey(),
  kind: "",
  params: [],
  values: {},
  excludeHit: true,
});

export const effectToDraft = (effect: CardEffect): EffectDraft => {
  const values: EffectDraft["values"] = {
    value: String(effect.value),
    form: effect.form,
    trigger: effect.trigger,
    skillId: effect.skillId?.toString(),
    chance: String(effect.chance),
    damageScale: String(effect.damageScale),
    target: effect.targetSkillId?.toString(),
    count: String(effect.count),
    onlyForm: effect.onlyForm,
    interval: effect.interval?.toString(),
  };
  const isSet: Record<EffectParam, boolean> = {
    value: effect.value !== 0,
    form: !!effect.form,
    trigger: !!effect.trigger,
    skillId: effect.skillId != null,
    chance: effect.chance !== 1,
    damageScale: effect.damageScale !== 1,
    target: effect.targetSkillId != null,
    count: effect.count !== 1,
    onlyForm: !!effect.onlyForm,
    excludeHit: effect.excludeHit,
    interval: effect.interval != null,
  };
  return {
    key: newKey(),
    id: effect.id,
    kind: effect.kind,
    params: EFFECT_PARAMS.map((p) => p.key).filter((k) => isSet[k]),
    values,
    excludeHit: effect.excludeHit,
  };
};

export const draftToRequest = (
  draft: EffectDraft,
  sortOrder: number,
): CardEffectRequest => {
  const body: CardEffectRequest = { sortOrder, kind: draft.kind };
  const value = (key: EffectParam) => draft.values[key]?.trim() || undefined;
  for (const key of draft.params) {
    if (key === "excludeHit") body.excludeHit = draft.excludeHit;
    else if (value(key) === undefined) continue;
    else if (NUMERIC.includes(key)) body[key as "value"] = Number(value(key));
    else if (key === "skillId" || key === "target")
      body[key] = Number(value(key));
    else body[key as "form"] = value(key);
  }
  return body;
};

const SKILL_REQUIRED_KINDS = ["onEvent", "periodic", "inherit"];

export const validateEffect = (
  draft: EffectDraft,
  label: string,
): string | null => {
  const has = (p: EffectParam) => draft.params.includes(p);
  const num = (key: EffectParam) => {
    const raw = draft.values[key]?.trim();
    return has(key) && raw ? Number(raw) : null;
  };

  if (!draft.kind) return `${label}: kind를 선택하세요.`;
  for (const key of draft.params) {
    if (key === "excludeHit") continue;
    if (!draft.values[key]?.trim())
      return `${label}: ${key} 값을 입력하거나 체크를 해제하세요.`;
  }
  const value = num("value");
  const chance = num("chance");
  const damageScale = num("damageScale");
  const count = num("count");
  const interval = num("interval");
  if (value !== null && !Number.isFinite(value))
    return `${label}: value는 유한한 숫자여야 합니다.`;
  if (chance !== null && !(chance > 0 && chance <= 1))
    return `${label}: chance는 0 초과 1 이하여야 합니다.`;
  if (damageScale !== null && !(damageScale > 0))
    return `${label}: damageScale은 0보다 커야 합니다.`;
  if (count !== null && !(Number.isInteger(count) && count >= 1))
    return `${label}: count는 1 이상의 정수여야 합니다.`;
  if (interval !== null && !(interval > 0))
    return `${label}: interval은 0보다 커야 합니다.`;
  if (draft.kind === "periodic" && interval === null)
    return `${label}: periodic 효과는 interval이 필요합니다.`;
  if (draft.kind === "form" && !has("form"))
    return `${label}: form 효과는 form이 필요합니다.`;
  if (
    draft.kind === "onEvent" &&
    draft.values.trigger === "Tick" &&
    has("trigger")
  )
    return `${label}: onEvent에는 Tick을 쓸 수 없습니다.`;
  if (SKILL_REQUIRED_KINDS.includes(draft.kind) && !has("skillId"))
    return `${label}: ${draft.kind} 효과는 skillId가 필요합니다.`;
  return null;
};
