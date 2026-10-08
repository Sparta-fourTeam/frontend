"use client";

import { useEffect, useState } from "react";
import { skillCastTypeApi } from "@/apis/skillCastType";
import { skillProjectilePathApi } from "@/apis/skillProjectilePath";
import type { NameLabelItem } from "@/apis/nameLabel";

export function useSkillOptions() {
  const [castTypes, setCastTypes] = useState<NameLabelItem[]>([]);
  const [projectilePaths, setProjectilePaths] = useState<NameLabelItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([skillCastTypeApi.getAll(), skillProjectilePathApi.getAll()])
      .then(([casts, paths]) => {
        if (ignore) return;
        setCastTypes(casts);
        setProjectilePaths(paths);
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof Error ? e.message : "선택 목록을 불러오지 못했습니다.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { castTypes, projectilePaths, error };
}
