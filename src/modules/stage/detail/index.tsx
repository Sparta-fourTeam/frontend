"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/stage.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import StageRewardForm from "../form";
import RatingRewardForm from "../form/ratingRewardForm";
import {
  getRewardDefinitions,
  type RewardDefinition,
} from "@/apis/rewardDefinition";
import { getRewardRules, type RewardRules } from "@/apis/rewardRules";
import {
  STAGE_RATINGS,
  createStageRatingReward,
  createStageReward,
  deleteStage,
  deleteStageRatingReward,
  deleteStageReward,
  getStage,
  getStageRatingRewards,
  getStageRewards,
  updateStageRatingReward,
  updateStageReward,
  type StageRating,
  type StageRatingReward,
  type StageRatingRewardRequest,
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
  const [ratingRewards, setRatingRewards] = useState<StageRatingReward[]>([]);
  const [rules, setRules] = useState<RewardRules | null>(null);
  const [definitions, setDefinitions] = useState<RewardDefinition[]>([]);
  const [version, setVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    // 기본 보상이 없으면 상세 조회가 404라서, 목록에서 찾아 등록 여부를 판단한다.
    Promise.all([
      getStage(stageId),
      getStageRewards(),
      getStageRatingRewards(stageId),
      getRewardRules(),
      getRewardDefinitions(),
    ])
      .then(([, rewardData, ratingData, rulesData, definitionData]) => {
        if (ignore) return;
        setReward(rewardData.find((r) => r.stageId === stageId) ?? null);
        setRatingRewards(ratingData);
        setRules(rulesData);
        setDefinitions([...definitionData].sort((a, b) => a.id - b.id));
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

  // 저장·삭제 후 최신 값으로 다시 불러와 각 폼을 새 값으로 초기화한다.
  const done = (message: string) => {
    setNotice(message);
    setError(null);
    setVersion((v) => v + 1);
  };

  const saveReward = async (value: StageRewardRequest) => {
    setNotice(null);
    if (reward) await updateStageReward(stageId, value);
    else await createStageReward(stageId, value);
    done("기본 보상을 저장했습니다.");
  };

  const removeReward = async () => {
    if (!confirm(`스테이지 ${stageId}의 기본 보상을 삭제할까요?`)) return;
    setNotice(null);
    await deleteStageReward(stageId);
    done("기본 보상을 삭제했습니다.");
  };

  const saveRating = async (
    rating: StageRating,
    exists: boolean,
    value: StageRatingRewardRequest,
  ) => {
    setNotice(null);
    if (exists) await updateStageRatingReward(stageId, rating, value);
    else await createStageRatingReward(stageId, rating, value);
    done(`별 ${rating}개 보상을 저장했습니다.`);
  };

  const removeRating = async (rating: StageRating) => {
    if (!confirm(`별 ${rating}개 보상 연결을 해제할까요?`)) return;
    setNotice(null);
    await deleteStageRatingReward(stageId, rating);
    done(`별 ${rating}개 보상 연결을 해제했습니다.`);
  };

  const hasAnyReward = !!reward || ratingRewards.length > 0;

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
          subtitle="기본 보상과 별등급 최초 클리어 보상을 관리합니다"
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
              disabled={hasAnyReward}
              title={
                hasAnyReward ? "등록된 보상을 모두 삭제해야 합니다" : undefined
              }
            >
              스테이지 삭제
            </Button>
          )}
        </div>
      </div>

      {(loadError || error) && (
        <p className={cx("error")}>{loadError ?? error}</p>
      )}
      {notice && <p className={cx("notice")}>{notice}</p>}
      {loaded && !rules && (
        <p className={cx("warning")}>
          보상 기준이 설정되지 않아 기본 보상을 저장할 수 없습니다.{" "}
          <Link href="/reward-rules">보상 기준 설정하기 →</Link>
        </p>
      )}

      {loaded ? (
        <>
          <StageRewardForm
            key={`reward-${version}`}
            reward={reward ?? undefined}
            rules={rules}
            onSave={saveReward}
            onDelete={reward ? removeReward : undefined}
          />

          <section className={cx("card")}>
            <h2 className={cx("cardTitle")}>
              별등급 보상 (최초 클리어)
              <span className={cx("hint")}>
                해당 별등급으로 처음 클리어할 때 한 번 · 고정 보상 묶음을 연결
              </span>
            </h2>
            <div className={cx("ratingList")}>
              {STAGE_RATINGS.map((rating) => {
                const ratingReward = ratingRewards.find(
                  (r) => r.rating === rating,
                );
                return (
                  <RatingRewardForm
                    key={`rating-${rating}-${version}`}
                    rating={rating}
                    reward={ratingReward}
                    definitions={definitions}
                    onSave={(value) =>
                      saveRating(rating, !!ratingReward, value)
                    }
                    onDelete={
                      ratingReward ? () => removeRating(rating) : undefined
                    }
                  />
                );
              })}
            </div>
          </section>
        </>
      ) : (
        !loadError && <p className={cx("empty")}>불러오는 중...</p>
      )}
    </>
  );
}
