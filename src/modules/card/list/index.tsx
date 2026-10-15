"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/card.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import { getCards, type CardSummary } from "@/apis/card";

const cx = classnames.bind(s);

export default function CardList() {
  const router = useRouter();
  const [cards, setCards] = useState<CardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getCards()
      .then((data) => {
        if (!ignore) setCards(data);
      })
      .catch((e) => {
        if (!ignore)
          setError(
            e instanceof Error ? e.message : "목록을 불러오지 못했습니다.",
          );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title="카드 관리"
          subtitle="카드를 선택하면 상세 화면으로 이동합니다"
          align="left"
        />
        <Button onClick={() => router.push("/cards/new")}>카드 추가</Button>
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : cards.length === 0 ? (
        <p className={cx("empty")}>등록된 카드가 없습니다.</p>
      ) : (
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("colNo")}>No.</th>
              <th>이름</th>
              <th>소속 스킬</th>
              <th>최대 선택</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <tr
                key={card.id}
                className={cx("clickable")}
                onClick={() => router.push(`/cards/${card.id}`)}
              >
                <td className={cx("muted")}>{index + 1}</td>
                <td className={cx("name")}>{card.name}</td>
                <td>{card.skillName}</td>
                <td>{card.maxPickCount}</td>
                <td className={cx(card.enabled ? "on" : "off")}>
                  {card.enabled ? "사용" : "비활성"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
