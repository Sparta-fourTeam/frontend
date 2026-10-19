import { useEffect, useState } from "react";
import { getSkills, type SkillSummary } from "@/apis/skill";
import { getUpgrades, type Upgrade } from "@/apis/upgrade";

export interface ItemOptions {
  skills: SkillSummary[];
  upgrades: Upgrade[];
}

// 아이템 화면에서 쓰는 스킬·강화 목록 (targetId 선택과 재료 연결 확인)
export function useItemOptions() {
  const [options, setOptions] = useState<ItemOptions>({
    skills: [],
    upgrades: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getSkills(), getUpgrades()])
      .then(([skills, upgrades]) => {
        if (ignore) return;
        setOptions({ skills, upgrades });
        setLoaded(true);
      })
      .catch((e) => {
        if (!ignore)
          setError(
            e instanceof Error ? e.message : "선택 목록을 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { options, loaded, error };
}

// 이 아이템을 재료로 쓰는 강화 id 목록
export const linkedUpgrades = (upgrades: Upgrade[], itemId: string) =>
  upgrades.filter((u) => u.materialItemId === itemId).map((u) => u.upgradeId);

export type ItemType = "skill" | "equipment" | "none";

// targetId가 강화 id면 장비 재료, 스킬 id면 스킬 재료, 없으면 대상 없는 아이템(상자 등)
export const itemTypeOf = (
  options: ItemOptions,
  targetId?: string | null,
): ItemType => {
  if (!targetId) return "none";
  if (options.upgrades.some((u) => u.upgradeId === targetId))
    return "equipment";
  return "skill";
};

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  skill: "스킬 재료",
  equipment: "장비 재료",
  none: "대상 없음",
};

// 목록·상세에 보여줄 연결 대상 이름
export const targetLabel = (options: ItemOptions, targetId?: string | null) => {
  if (!targetId) return null;
  const type = itemTypeOf(options, targetId);
  if (type === "equipment") return `강화 ${targetId}`;
  const skill = options.skills.find((sk) => String(sk.id) === targetId);
  return skill
    ? `${skill.name} (${targetId})`
    : `${targetId} (알 수 없는 대상)`;
};
