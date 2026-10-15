import type { SkillDetail, SkillRequest } from "@/apis/skill";
import { parseStats, stringifyStats } from "./baseStats";

export interface SkillFormState {
  name: string;
  desc: string;
  castTypeId: string;
  projectilePathId: string;
  elementId: string;
  maxLevel: string;
  childOnly: boolean;
  unlockLevel: string;
  progressionId: string;
  statsText: string;
}

export const createEmptyForm = (): SkillFormState => ({
  name: "",
  desc: "",
  castTypeId: "",
  projectilePathId: "",
  elementId: "",
  maxLevel: "1",
  childOnly: false,
  unlockLevel: "1",
  progressionId: "",
  statsText: "",
});

export const detailToForm = (skill: SkillDetail): SkillFormState => ({
  name: skill.name,
  desc: skill.desc ?? "",
  castTypeId: String(skill.castType.id),
  projectilePathId: String(skill.projectilePath.id),
  elementId: skill.element ? String(skill.element.id) : "",
  maxLevel: String(skill.maxLevel),
  childOnly: skill.childOnly,
  unlockLevel: String(skill.unlockLevel ?? 1),
  progressionId: skill.progressionId ?? "",
  statsText: stringifyStats(skill.baseStats ?? {}),
});

const toNumber = (value: string) =>
  value.trim() === "" ? null : Number(value);

export const validateForm = (form: SkillFormState): string | null => {
  const stats = parseStats(form.statsText);
  return stats.ok ? null : `기본 수치를 확인하세요. ${stats.error}`;
};

export const formToRequest = (form: SkillFormState): SkillRequest => {
  const stats = parseStats(form.statsText);
  const request: SkillRequest = {
    name: form.name.trim(),
    castTypeId: Number(form.castTypeId),
    projectilePathId: Number(form.projectilePathId),
    maxLevel: Number(form.maxLevel),
    childOnly: form.childOnly,
    baseStats: stats.ok ? stats.stats : {},
  };
  const desc = form.desc.trim();
  if (desc !== "") request.desc = desc;
  if (form.elementId !== "") request.elementId = Number(form.elementId);
  const unlockLevel = toNumber(form.unlockLevel);
  if (unlockLevel !== null) request.unlockLevel = unlockLevel;
  const progressionId = form.progressionId.trim();
  if (progressionId !== "") request.progressionId = progressionId;

  return request;
};
