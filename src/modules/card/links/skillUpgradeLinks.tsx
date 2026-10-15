"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "./links.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import CardLinkManager from "./cardLinkManager";
import { getCards, type CardSummary } from "@/apis/card";
import { getSkill } from "@/apis/skill";

const cx = classnames.bind(s);

export default function SkillUpgradeLinks({ skillId }: { skillId: number }) {
  const router = useRouter();
  const [skillName, setSkillName] = useState<string | null>(null);
  const [cards, setCards] = useState<CardSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getSkill(String(skillId)), getCards()])
      .then(([skill, cardData]) => {
        if (ignore) return;
        setSkillName(skill.name);
        setCards(cardData);
      })
      .catch((e) => {
        if (!ignore)
          setError(e instanceof Error ? e.message : "불러오지 못했습니다.");
      });
    return () => {
      ignore = true;
    };
  }, [skillId]);

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title={skillName ? `${skillName} 카드 연결` : "카드 연결"}
          subtitle="카드를 클릭해 선행 카드·배제 카드를 편집합니다"
          align="left"
        />
        <Button variant="outline" onClick={() => router.push("/skills")}>
          목록으로
        </Button>
      </div>
      {error && <p className={cx("error")}>{error}</p>}
      {cards ? (
        <CardLinkManager skillId={skillId} cards={cards} />
      ) : (
        !error && <p className={cx("muted")}>불러오는 중...</p>
      )}
    </>
  );
}
