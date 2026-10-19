"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/rewardDefinition.module.scss";
import Title from "@/components/common/Title";
import RewardDefinitionForm from "../form";
import { useCatalog } from "../form/useCatalog";
import {
  createRewardDefinition,
  type RewardDefinitionRequest,
} from "@/apis/rewardDefinition";

const cx = classnames.bind(s);

export default function RewardDefinitionCreate() {
  const router = useRouter();
  const { catalog, error: catalogError } = useCatalog();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async ({
    name,
    gold,
    items,
  }: RewardDefinitionRequest) => {
    try {
      await createRewardDefinition({ name, gold, items });
      router.push("/reward-definitions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title="고정 보상 묶음 추가" align="left" />
      {catalogError && <p className={cx("error")}>{catalogError}</p>}
      <RewardDefinitionForm
        catalog={catalog}
        submitText="등록"
        error={error}
        onSubmit={handleSubmit}
      />
    </>
  );
}
