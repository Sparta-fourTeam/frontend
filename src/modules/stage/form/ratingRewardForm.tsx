"use client";

import { useState } from "react";
import Link from "next/link";
import classnames from "classnames/bind";
import s from "../components/stage.module.scss";
import Button from "@/components/common/Button";
import type { RewardDefinition } from "@/apis/rewardDefinition";
import type {
  StageRating,
  StageRatingReward,
  StageRatingRewardRequest,
} from "@/apis/stage";

const cx = classnames.bind(s);

interface RatingRewardFormProps {
  rating: StageRating;
  reward?: StageRatingReward;
  definitions: RewardDefinition[];
  onSave: (value: StageRatingRewardRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

// 별등급(1~3) 최초 클리어 보상: 공통 고정 보상 묶음을 하나 연결한다.
export default function RatingRewardForm({
  rating,
  reward,
  definitions,
  onSave,
  onDelete,
}: RatingRewardFormProps) {
  const [definitionId, setDefinitionId] = useState(
    reward ? String(reward.rewardDefinitionId) : "",
  );
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selected = definitions.find((d) => String(d.id) === definitionId);
  const items = Object.entries(selected?.items ?? {});
  const unchanged =
    !!reward && String(reward.rewardDefinitionId) === definitionId;

  const run = async (
    kind: "submit" | "delete",
    action: () => Promise<void>,
  ) => {
    setBusy(kind);
    try {
      await action();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "요청에 실패했습니다.");
    }
    setBusy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!definitionId) {
      setMessage("연결할 보상 묶음을 선택하세요.");
      return;
    }
    setMessage(null);
    await run("submit", () =>
      onSave({ rewardDefinitionId: Number(definitionId) }),
    );
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    setMessage(null);
    await run("delete", onDelete);
  };

  return (
    <form className={cx("ratingItem")} onSubmit={handleSubmit}>
      <div className={cx("ratingHead")}>
        <span className={cx("stars")} aria-label={`별 ${rating}개`}>
          {"★".repeat(rating)}
          <span className={cx("starsEmpty")}>{"★".repeat(3 - rating)}</span>
        </span>
        <span className={cx(reward ? "on" : "off")}>
          {reward ? "등록됨" : "미등록"}
        </span>
      </div>

      <div className={cx("grid")}>
        <label className={cx("field", "wide")}>
          <span className={cx("fieldLabel")}>보상 묶음 *</span>
          <select
            className={cx("input")}
            value={definitionId}
            onChange={(e) => setDefinitionId(e.target.value)}
          >
            <option value="">선택</option>
            {reward &&
              !definitions.some((d) => d.id === reward.rewardDefinitionId) && (
                <option value={reward.rewardDefinitionId}>
                  #{reward.rewardDefinitionId} (목록에 없음)
                </option>
              )}
            {definitions.map((d) => (
              <option key={d.id} value={d.id}>
                #{d.id} {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={cx("definitionPreview")}>
        {selected ? (
          <>
            <span className={cx("tag")}>골드 {selected.gold}</span>
            {items.map(([itemId, amount]) => (
              <span key={itemId} className={cx("tag")}>
                {itemId} ×{amount}
              </span>
            ))}
            <Link
              className={cx("previewLink")}
              href={`/reward-definitions/${selected.id}`}
            >
              묶음 편집 →
            </Link>
          </>
        ) : (
          <span className={cx("muted")}>
            묶음을 선택하면 지급 내용이 표시됩니다.{" "}
            <Link className={cx("previewLink")} href="/reward-definitions/new">
              새 묶음 만들기 →
            </Link>
          </span>
        )}
      </div>

      <div className={cx("footer")}>
        {message && <p className={cx("inlineError")}>{message}</p>}
        {onDelete && (
          <Button
            size="small"
            variant="danger"
            onClick={handleDelete}
            disabled={busy !== null}
          >
            {busy === "delete" ? "삭제 중..." : "연결 해제"}
          </Button>
        )}
        <Button
          size="small"
          type="submit"
          disabled={busy !== null || unchanged}
        >
          {busy === "submit" ? "저장 중..." : reward ? "저장" : "등록"}
        </Button>
      </div>
    </form>
  );
}
