"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Title from "@/components/common/Title";
import UpgradeForm from "../form";
import { createUpgrade, type UpgradeCreateRequest } from "@/apis/upgrade";

export default function UpgradeCreate() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (value: UpgradeCreateRequest) => {
    try {
      await createUpgrade(value);
      router.push("/upgrades");
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title="강화 추가" align="left" />
      <UpgradeForm submitText="등록" error={error} onSubmit={handleSubmit} />
    </>
  );
}
