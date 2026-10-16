import { useEffect, useState } from "react";
import { getSkills, type SkillSummary } from "@/apis/skill";
import { getUpgrades, type Upgrade } from "@/apis/upgrade";

export interface ItemOptions {
  skills: SkillSummary[];
  upgrades: Upgrade[];
}

// 아이템 화면에서 쓰는 스킬 목록(targetId 선택)과 강화 목록(재료 연결 확인)
export function useItemOptions() {
  const [options, setOptions] = useState<ItemOptions>({
    skills: [],
    upgrades: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getSkills(), getUpgrades()])
      .then(([skills, upgrades]) => {
        if (!ignore) setOptions({ skills, upgrades });
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

  return { options, error };
}

// 이 아이템을 재료로 쓰는 강화 id 목록
export const linkedUpgrades = (upgrades: Upgrade[], itemId: string) =>
  upgrades.filter((u) => u.materialItemId === itemId).map((u) => u.upgradeId);
