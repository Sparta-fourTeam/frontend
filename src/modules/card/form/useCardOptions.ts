"use client";

import { useEffect, useState } from "react";
import { getSkills, type SkillSummary } from "@/apis/skill";
import { getCards, type CardSummary } from "@/apis/card";
import { skillFormApi } from "@/apis/skillForm";
import { effectTriggerApi } from "@/apis/effectTrigger";
import { effectKindApi } from "@/apis/effectKind";
import type { NameLabelItem } from "@/apis/nameLabel";

export interface CardOptions {
  skills: SkillSummary[];
  cards: CardSummary[];
  forms: NameLabelItem[];
  triggers: NameLabelItem[];
  kinds: NameLabelItem[];
}

const EMPTY: CardOptions = {
  skills: [],
  cards: [],
  forms: [],
  triggers: [],
  kinds: [],
};

export function useCardOptions() {
  const [options, setOptions] = useState<CardOptions>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      getSkills(),
      getCards(),
      skillFormApi.getAll(),
      effectTriggerApi.getAll(),
      effectKindApi.getAll(),
    ])
      .then(([skills, cards, forms, triggers, kinds]) => {
        if (!ignore) setOptions({ skills, cards, forms, triggers, kinds });
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
