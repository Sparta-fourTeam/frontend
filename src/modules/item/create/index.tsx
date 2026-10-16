"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/item.module.scss";
import Title from "@/components/common/Title";
import ItemForm from "../form";
import { useItemOptions } from "../form/useItemOptions";
import { createItem, type ItemCreateRequest } from "@/apis/item";

const cx = classnames.bind(s);

export default function ItemCreate() {
  const router = useRouter();
  const { options, error: optionError } = useItemOptions();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (value: ItemCreateRequest) => {
    try {
      await createItem(value);
      router.push("/items");
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title="아이템 추가" align="left" />
      {optionError && <p className={cx("error")}>{optionError}</p>}
      <ItemForm
        options={options}
        submitText="등록"
        error={error}
        onSubmit={handleSubmit}
      />
    </>
  );
}
