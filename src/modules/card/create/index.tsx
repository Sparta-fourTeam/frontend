"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/card.module.scss";
import Title from "@/components/common/Title";
import CardForm from "../form";
import { useCardOptions } from "../form/useCardOptions";
import { CardSaveError, saveCard } from "../form/saveCard";
import type { CardFormValue } from "../form/cardFormState";

const cx = classnames.bind(s);

export default function CardCreate() {
  const router = useRouter();
  const { options, error: optionError } = useCardOptions();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (value: CardFormValue) => {
    try {
      await saveCard(value);
      router.push("/cards");
    } catch (e) {
      if (e instanceof CardSaveError && e.cardId !== undefined) {
        router.push(`/cards/${e.cardId}`);
        return;
      }
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title="카드 추가" align="left" />
      {optionError && <p className={cx("error")}>{optionError}</p>}
      <CardForm
        options={options}
        submitText="등록"
        error={error}
        onSubmit={handleSubmit}
      />
    </>
  );
}
