import type {
  Upgrade,
  UpgradeCreateRequest,
  UpgradeEffect,
} from "@/apis/upgrade";

export type EffectMode = "valuePerLevel" | "levelValues";

export interface UpgradeEffectDraft {
  key: string;
  kind: string;
  mode: EffectMode;
  valuePerLevel: string;
  levelValues: string[];
}

// linear: base + step × L, levels: 레벨별 직접 지정(levelCosts·materialCosts)
export type CostMode = "linear" | "levels";

export interface UpgradeFormState {
  upgradeId: string;
  maxLevel: string;
  unlockLevel: string;
  materialItemId: string;
  costBase: string;
  costStep: string;
  materialBase: string;
  materialStep: string;
  costMode: CostMode;
  levelCosts: string[];
  materialMode: CostMode;
  materialCosts: string[];
  effects: UpgradeEffectDraft[];
}

export type NumberKey =
  | "maxLevel"
  | "unlockLevel"
  | "costBase"
  | "costStep"
  | "materialBase"
  | "materialStep";

// levelValues 입력칸을 그릴 최대 개수 (maxLevel을 잘못 입력해도 화면이 멈추지 않게)
export const MAX_LEVEL_INPUTS = 100;

let seq = 0;
const newKey = () => `upgrade-effect-${++seq}`;

const str = (v: number | string | null | undefined) =>
  v == null ? "" : String(v);

export const emptyEffect = (): UpgradeEffectDraft => ({
  key: newKey(),
  kind: "",
  mode: "valuePerLevel",
  valuePerLevel: "",
  levelValues: [],
});

const effectToDraft = (effect: UpgradeEffect): UpgradeEffectDraft => ({
  key: newKey(),
  kind: effect.kind,
  mode: effect.levelValues != null ? "levelValues" : "valuePerLevel",
  valuePerLevel: str(effect.valuePerLevel),
  levelValues: (effect.levelValues ?? []).map(String),
});

export const toFormState = (upgrade?: Upgrade): UpgradeFormState => ({
  upgradeId: upgrade?.upgradeId ?? "",
  maxLevel: str(upgrade?.maxLevel),
  unlockLevel: str(upgrade?.unlockLevel),
  materialItemId: upgrade?.materialItemId ?? "",
  costBase: str(upgrade?.costBase),
  costStep: str(upgrade?.costStep),
  materialBase: str(upgrade?.materialBase),
  materialStep: str(upgrade?.materialStep),
  costMode: upgrade?.levelCosts ? "levels" : "linear",
  levelCosts: (upgrade?.levelCosts ?? []).map(String),
  materialMode: upgrade?.materialCosts ? "levels" : "linear",
  materialCosts: (upgrade?.materialCosts ?? []).map(String),
  effects: (upgrade?.effects ?? []).map(effectToDraft),
});

const text = (value: string) =>
  value.trim() === "" ? undefined : value.trim();
const num = (value: string) =>
  value.trim() === "" ? undefined : Number(value);
const isInt = (value: string) => /^-?\d+$/.test(value.trim());

// levelValues는 항상 maxLevel 길이로 맞춰서 다룬다.
export const fitLevels = (values: string[], maxLevel: number) =>
  Array.from({ length: maxLevel }, (_, i) => values[i] ?? "");

export const levelCount = (maxLevel: string) => {
  const n = Number(maxLevel);
  return Number.isInteger(n) && n > 0 ? Math.min(n, MAX_LEVEL_INPUTS) : 0;
};

const NON_NEGATIVE: { key: NumberKey; label: string }[] = [
  { key: "costBase", label: "costBase" },
  { key: "costStep", label: "costStep" },
  { key: "materialBase", label: "materialBase" },
  { key: "materialStep", label: "materialStep" },
];

export const validateUpgrade = (
  form: UpgradeFormState,
  isCreate: boolean,
): string | null => {
  if (isCreate && !form.upgradeId.trim()) return "강화 ID를 입력하세요.";

  if (!isInt(form.maxLevel) || Number(form.maxLevel) < 1)
    return "최대 레벨은 1 이상의 정수입니다.";
  const maxLevel = Number(form.maxLevel);
  if (maxLevel > MAX_LEVEL_INPUTS)
    return `최대 레벨은 ${MAX_LEVEL_INPUTS} 이하로 입력하세요.`;

  if (
    form.unlockLevel.trim() !== "" &&
    (!isInt(form.unlockLevel) || Number(form.unlockLevel) < 1)
  )
    return "해금 레벨은 1 이상의 정수입니다.";

  const linear = NON_NEGATIVE.filter(({ key }) =>
    key.startsWith("cost")
      ? form.costMode === "linear"
      : form.materialMode === "linear",
  );
  for (const { key, label } of linear) {
    const value = form[key];
    if (value.trim() !== "" && (!isInt(value) || Number(value) < 0))
      return `${label}는 0 이상의 정수입니다.`;
  }

  const levelCostError = (values: string[], label: string) => {
    const levels = fitLevels(values, maxLevel);
    const bad = levels.findIndex((v) => !isInt(v) || Number(v) < 1);
    return bad >= 0
      ? `${label}: Lv.${bad}→${bad + 1} 값을 1 이상의 정수로 입력하세요.`
      : null;
  };
  if (form.costMode === "levels") {
    const message = levelCostError(form.levelCosts, "레벨별 골드 비용");
    if (message) return message;
  }
  if (form.materialMode === "levels") {
    const message = levelCostError(form.materialCosts, "레벨별 재료 수량");
    if (message) return message;
  }

  // 서버 규칙: 재료 아이템과 재료 비용(materialBase 또는 materialCosts)은 함께 있어야 한다.
  const hasMaterialCost =
    form.materialMode === "levels" || form.materialBase.trim() !== "";
  if (!!form.materialItemId !== hasMaterialCost)
    return form.materialItemId
      ? "재료 아이템을 고르면 재료 비용(materialBase 또는 레벨별 재료 수량)도 입력해야 합니다."
      : "재료 비용을 입력하려면 재료 아이템을 선택하세요.";

  for (const [i, effect] of form.effects.entries()) {
    const label = `효과 ${i + 1}`;
    if (!effect.kind.trim()) return `${label}: kind를 입력하세요.`;
    if (effect.mode === "valuePerLevel") {
      if (!isInt(effect.valuePerLevel))
        return `${label}: valuePerLevel은 정수입니다.`;
      continue;
    }
    const levels = fitLevels(effect.levelValues, maxLevel);
    const blank = levels.findIndex((v) => !isInt(v));
    if (blank >= 0) return `${label}: Lv.${blank + 1} 값을 정수로 입력하세요.`;
  }
  return null;
};

export const toRequest = (form: UpgradeFormState): UpgradeCreateRequest => {
  const maxLevel = Number(form.maxLevel);
  return {
    upgradeId: form.upgradeId.trim(),
    maxLevel,
    // 서버 컬럼이 NOT NULL이라 비워두면 기본값 1을 보낸다.
    unlockLevel: num(form.unlockLevel) ?? 1,
    materialItemId: text(form.materialItemId),
    ...(form.costMode === "linear"
      ? { costBase: num(form.costBase), costStep: num(form.costStep) }
      : { levelCosts: fitLevels(form.levelCosts, maxLevel).map(Number) }),
    ...(form.materialMode === "linear"
      ? {
          materialBase: num(form.materialBase),
          materialStep: num(form.materialStep),
        }
      : {
          materialCosts: fitLevels(form.materialCosts, maxLevel).map(Number),
        }),
    effects: form.effects.map((effect) =>
      effect.mode === "valuePerLevel"
        ? {
            kind: effect.kind.trim(),
            valuePerLevel: Number(effect.valuePerLevel),
          }
        : {
            kind: effect.kind.trim(),
            levelValues: fitLevels(effect.levelValues, maxLevel).map(Number),
          },
    ),
  };
};
