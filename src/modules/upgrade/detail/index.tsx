"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/upgrade.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import UpgradeForm from "../form";
import {
  deleteUpgrade,
  getUpgrade,
  updateUpgrade,
  type Upgrade,
  type UpgradeCreateRequest,
} from "@/apis/upgrade";

const cx = classnames.bind(s);

interface UpgradeDetailProps {
  upgradeId: string;
}

export default function UpgradeDetail({ upgradeId }: UpgradeDetailProps) {
  const router = useRouter();
  const [upgrade, setUpgrade] = useState<Upgrade | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getUpgrade(upgradeId)
      .then((data) => {
        if (!ignore) setUpgrade(data);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "강화를 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, [upgradeId]);

  const handleSubmit = async (value: UpgradeCreateRequest) => {
    try {
      await updateUpgrade(upgradeId, value);
      router.push("/upgrades");
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`'${upgradeId}' 강화를 삭제할까요?`)) return;
    try {
      await deleteUpgrade(upgradeId);
      router.push("/upgrades");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title title={upgradeId} subtitle="강화 상세" align="left" />
        <Button variant="outline" onClick={() => router.push("/upgrades")}>
          목록으로
        </Button>
      </div>
      {loadError && <p className={cx("error")}>{loadError}</p>}

      {upgrade ? (
        <UpgradeForm
          upgrade={upgrade}
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
