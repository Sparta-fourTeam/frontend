"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/item.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import ItemForm from "../form";
import { useItemOptions } from "../form/useItemOptions";
import {
  deleteItem,
  getItem,
  updateItem,
  type Item,
  type ItemCreateRequest,
} from "@/apis/item";

const cx = classnames.bind(s);

interface ItemDetailProps {
  itemId: string;
}

export default function ItemDetail({ itemId }: ItemDetailProps) {
  const router = useRouter();
  const { options, loaded, error: optionError } = useItemOptions();
  const [item, setItem] = useState<Item | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getItem(itemId)
      .then((data) => {
        if (!ignore) setItem(data);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "아이템을 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, [itemId]);

  const handleSubmit = async ({ targetId }: ItemCreateRequest) => {
    try {
      await updateItem(itemId, { targetId });
      router.push("/items");
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`'${itemId}' 아이템을 삭제할까요?`)) return;
    try {
      await deleteItem(itemId);
      router.push("/items");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title title={itemId} subtitle="아이템 상세" align="left" />
        <Button variant="outline" onClick={() => router.push("/items")}>
          목록으로
        </Button>
      </div>
      {(loadError || optionError) && (
        <p className={cx("error")}>{loadError ?? optionError}</p>
      )}

      {/* 대상 종류(스킬/강화)를 판별하려면 선택 목록이 먼저 있어야 한다. */}
      {item && loaded ? (
        <ItemForm
          item={item}
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
