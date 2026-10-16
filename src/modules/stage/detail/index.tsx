"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/stage.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import StageRewardForm from "../form";
import { getItems, type Item } from "@/apis/item";
import {
  createStageReward,
  deleteStage,
  deleteStageReward,
  getStage,
  getStageRewards,
  updateStageReward,
  type StageReward,
  type StageRewardRequest,
} from "@/apis/stage";

const cx = classnames.bind(s);

interface StageDetailProps {
  stageId: number;
}

export default function StageDetail({ stageId }: StageDetailProps) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [reward, setReward] = useState<StageReward | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [version, setVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    // 보상이 없으면 상세 조회가 404라서, 목록에서 찾아 등록 여부를 판단한다.
    Promise.all([getStage(stageId), getStageRewards(), getItems()])
      .then(([, rewardData, itemData]) => {
        if (ignore) return;
        setReward(rewardData.find((r) => r.stageId === stageId) ?? null);
        setItems(itemData);
        setLoaded(true);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "스테이지를 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, [stageId, version]);

  const reload = () => {
    setError(null);
    setVersion((v) => v + 1);
  };

  const handleSubmit = async (value: StageRewardRequest) => {
    try {
      if (reward) await updateStageReward(stageId, value);
      else await createStageReward(stageId, value);
      router.push("/stages");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했습니다.");
    }
  };

  const handleDeleteReward = async () => {
    if (!confirm(`스테이지 ${stageId}의 보상을 삭제할까요?`)) return;
    try {
      await deleteStageReward(stageId);
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "보상 삭제에 실패했습니다.");
    }
  };

  const handleDeleteStage = async () => {
    if (!confirm(`스테이지 ${stageId}을(를) 삭제할까요?`)) return;
    try {
      await deleteStage(stageId);
      router.push("/stages");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title={`스테이지 ${stageId}`}
          subtitle={
            !loaded
              ? "스테이지 상세"
              : reward
                ? "20웨이브 완료 보상을 수정합니다"
                : "보상이 아직 없습니다. 아래에서 등록하세요"
          }
          align="left"
        />
        <div className={cx("headerActions")}>
          <Button variant="outline" onClick={() => router.push("/stages")}>
            목록으로
          </Button>
          {loaded && (
            <Button
              variant="danger"
              onClick={handleDeleteStage}
              disabled={!!reward}
              title={reward ? "보상을 먼저 삭제해야 합니다" : undefined}
            >
              스테이지 삭제
            </Button>
          )}
        </div>
      </div>
      {loadError && <p className={cx("error")}>{loadError}</p>}

      {loaded ? (
        <StageRewardForm
          key={`${version}-${reward ? "edit" : "new"}`}
          reward={reward ?? undefined}
          items={items}
          submitText={reward ? "저장" : "보상 등록"}
          error={error}
          onSubmit={handleSubmit}
          onDelete={reward ? handleDeleteReward : undefined}
        />
      ) : (
        !loadError && <p className={cx("empty")}>불러오는 중...</p>
      )}
    </>
  );
}
