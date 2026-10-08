import { STAT_GROUPS, type StatGroupKey } from "@/constants/skillStats";
import type { SkillBaseStats, SkillDetail, SkillRequest, StatGroupValues } from "@/apis/skill";

export interface StatGroupState {
  enabled: boolean;
  values: Record<string, string>;
}

export interface SkillFormState {
  name: string;
  desc: string;
  castTypeId: string;
  projectilePathId: string;
  maxLevel: string;
  childOnly: boolean;
  unlockLevel: string;
  groups: Record<StatGroupKey, StatGroupState>;
}

const emptyGroups = () =>
  Object.fromEntries(
    STAT_GROUPS.map((g) => [
      g.key,
      { enabled: false, values: Object.fromEntries(g.fields.map((f) => [f.key, ""])) },
    ]),
  ) as Record<StatGroupKey, StatGroupState>;

export const createEmptyForm = (): SkillFormState => ({
  name: "",
  desc: "",
  castTypeId: "",
  projectilePathId: "",
  maxLevel: "1",
  childOnly: false,
  unlockLevel: "1",
  groups: emptyGroups(),
});

export const detailToForm = (skill: SkillDetail): SkillFormState => {
  const groups = emptyGroups();
  for (const group of STAT_GROUPS) {
    const data = skill.baseStats?.[group.key] as Record<string, number | null> | undefined;
    if (!data) continue;
    groups[group.key].enabled = true;
    for (const field of group.fields) {
      const value = data[field.key] ?? (field.responseKey ? data[field.responseKey] : null);
      groups[group.key].values[field.key] = value == null ? "" : String(value);
    }
  }
  return {
    name: skill.name,
    desc: skill.desc ?? "",
    castTypeId: String(skill.castType.id),
    projectilePathId: String(skill.projectilePath.id),
    maxLevel: String(skill.maxLevel),
    childOnly: skill.childOnly,
    unlockLevel: String(skill.unlockLevel ?? 1),
    groups,
  };
};

const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));

// 체크 안 한 그룹, 비워둔 칸은 요청에서 빠짐
export const formToRequest = (form: SkillFormState): SkillRequest => {
  const baseStats: SkillBaseStats = {};
  for (const group of STAT_GROUPS) {
    const state = form.groups[group.key];
    if (!state.enabled) continue;
    const values: StatGroupValues = {};
    for (const field of group.fields) {
      const value = toNumber(state.values[field.key]);
      if (value !== null) values[field.key] = value;
    }
    baseStats[group.key] = values;
  }

  const request: SkillRequest = {
    name: form.name.trim(),
    castTypeId: Number(form.castTypeId),
    projectilePathId: Number(form.projectilePathId),
    maxLevel: Number(form.maxLevel),
    childOnly: form.childOnly,
    baseStats,
  };
  const desc = form.desc.trim();
  if (desc !== "") request.desc = desc;
  const unlockLevel = toNumber(form.unlockLevel);
  if (unlockLevel !== null) request.unlockLevel = unlockLevel;

  return request;
};
