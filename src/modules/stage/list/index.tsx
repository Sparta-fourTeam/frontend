"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/stage.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import {
  createStage,
  getStageRewards,
  getStages,
  type Stage,
  type StageReward,
} from "@/apis/stage";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

export default function StageList() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [rewards, setRewards] = useState<Map<number, StageReward>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStageId, setNewStageId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let ignore = false;
    Promise.all([getStages(), getStageRewards()])
      .then(([stageData, rewardData]) => {
        if (ignore) return;
        setStages([...stageData].sort((a, b) => a.stageId - b.stageId));
        setRewards(new Map(rewardData.map((r) => [r.stageId, r])));
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

  const goDetail = (stageId: number) => router.push(`/stages/${stageId}`);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adding) return;
    const stageId = Number(newStageId);
    if (!Number.isInteger(stageId) || newStageId.trim() === "") {
      setError("스테이지 ID는 정수로 입력하세요.");
      return;
    }
    setAdding(true);
    try {
      await createStage(stageId);
      goDetail(stageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setAdding(false);
    }
  };

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title="스테이지 관리"
          subtitle="스테이지를 선택하면 보상을 등록·수정할 수 있습니다"
          align="left"
        />
        <form className={cx("headerActions")} onSubmit={handleAdd}>
          <input
            type="number"
            className={cx("input", "addInput")}
            value={newStageId}
            onChange={(e) => setNewStageId(e.target.value)}
            onWheel={preventWheel}
            placeholder="스테이지 ID"
            step={1}
            aria-label="새 스테이지 ID"
          />
          <Button type="submit" disabled={adding}>
            {adding ? "추가 중..." : "스테이지 추가"}
          </Button>
        </form>
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : stages.length === 0 ? (
        !error && <p className={cx("empty")}>등록된 스테이지가 없습니다.</p>
      ) : (
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("colNo")}>No.</th>
              <th>스테이지 ID</th>
              <th>보상</th>
              <th>baseExp</th>
              <th>3성 보너스 Exp</th>
              <th>finalCoin</th>
              <th>보상 아이템</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, index) => {
              const reward = rewards.get(stage.stageId);
              return (
                <tr
                  key={stage.stageId}
                  className={cx("clickable")}
                  onClick={() => goDetail(stage.stageId)}
                >
                  <td className={cx("muted")}>{index + 1}</td>
                  <td className={cx("name")}>{stage.stageId}</td>
                  <td className={cx(reward ? "on" : "off")}>
                    {reward ? "등록됨" : "미등록"}
                  </td>
                  <td>{reward?.baseExp ?? "-"}</td>
                  <td>{reward?.threeStarBonusExp ?? "-"}</td>
                  <td>{reward?.finalCoin ?? "-"}</td>
                  <td>
                    {reward?.items.length ? (
                      <div className={cx("tags")}>
                        {reward.items.map((item) => (
                          <span key={item.itemId} className={cx("tag")}>
                            {item.itemId} ×{item.finalAmount}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={cx("muted")}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
