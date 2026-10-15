"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/card.module.scss";
import Title from "@/components/common/Title";
import CardForm from "../form";
import { useCardOptions } from "../form/useCardOptions";
import { saveCard } from "../form/saveCard";
import type { CardFormValue } from "../form/cardFormState";
import {
  deleteCard,
  getCard,
  type CardDetail as CardDetailData,
} from "@/apis/card";

const cx = classnames.bind(s);

interface CardDetailProps {
  cardId: number;
}

export default function CardDetail({ cardId }: CardDetailProps) {
  const router = useRouter();
  const { options, error: optionError } = useCardOptions();
  const [card, setCard] = useState<CardDetailData | null>(null);
  const [version, setVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getCard(cardId)
      .then((data) => {
        if (!ignore) setCard(data);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "카드를 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, [cardId, version]);

  const handleSubmit = async (value: CardFormValue) => {
    if (!card) return;
    try {
      await saveCard(value, card);
      router.push("/cards");
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.");
      setVersion((v) => v + 1);
    }
  };

  const handleDelete = async () => {
    if (
      !card ||
      !confirm(
        `'${card.name}' 카드를 삭제할까요? 효과와 변형도 함께 삭제됩니다.`,
      )
    )
      return;
    try {
      await deleteCard(cardId);
      router.push("/cards");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title={card ? card.name : "카드 상세"} align="left" />
      {(loadError || optionError) && (
        <p className={cx("error")}>{loadError ?? optionError}</p>
      )}

      {card ? (
        <CardForm
          key={version}
          card={card}
          options={options}
          submitText="저장"
          error={error}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      ) : (
        !loadError && <p className={cx("empty")}>불러오는 중...</p>
      )}
    </>
  );
}
