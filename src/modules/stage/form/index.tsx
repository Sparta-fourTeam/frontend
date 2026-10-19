"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/stage.module.scss";
import Button from "@/components/common/Button";
import RewardItemsEditor from "@/components/common/RewardItemsEditor";
import {
  minCoin,
  minItemAmount,
  toFormState,
  toRequest,
  validateReward,
  type StageRewardFormState,
} from "./stageRewardFormState";
import type { RewardRules } from "@/apis/rewardRules";
import type { StageReward, StageRewardRequest } from "@/apis/stage";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

const KIND_LABEL: Record<string, string> = {
  SkillMaterial: "스킬 재료",
  EquipmentMaterial: "장비 재료",
  GemChest: "젬 상자",
};

type NumberKey = "baseExp" | "threeStarBonusExp" | "finalCoin";

interface StageRewardFormProps {
  reward?: StageReward;
  rules: RewardRules | null;
  onSave: (value: StageRewardRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

// 웨이브 진행(배틀 종료) 기본 보상
export default function StageRewardForm({
  reward,
  rules,
  onSave,
  onDelete,
}: StageRewardFormProps) {
  const [form, setForm] = useState(() => toFormState(reward));
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const set = <K extends keyof StageRewardFormState>(
    key: K,
    value: StageRewardFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const coinMin = minCoin(rules);
  const numberFields: {
    key: NumberKey;
    label: string;
    hint: string;
    min: number;
  }[] = [
    {
      key: "baseExp",
      label: "baseExp *",
      hint: "웨이브 1개 이상 완료 시 1회",
      min: 0,
    },
    {
      key: "threeStarBonusExp",
      label: "threeStarBonusExp *",
      hint: "20웨이브 3별 완료 추가",
      min: 0,
    },
    {
      key: "finalCoin",
      label: "finalCoin *",
      hint: `20웨이브 총 코인 · ${coinMin} 이상`,
      min: coinMin,
    },
  ];

  // 보상 기준에 분류된 itemId만 선택 가능 (랜덤 추첨 ID 포함)
  const options = Object.entries(rules?.items ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([itemId, rule]) => ({
      value: itemId,
      text: `${itemId} · ${KIND_LABEL[rule.kind] ?? rule.kind}${rule.random ? " · 랜덤" : ""}`,
    }));

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
    const invalid = validateReward(form, rules);
    setMessage(invalid);
    if (invalid) return;
    await run("submit", () => onSave(toRequest(form)));
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    setMessage(null);
    await run("delete", onDelete);
  };

  return (
    <form className={cx("card")} onSubmit={handleSubmit}>
      <h2 className={cx("cardTitle")}>
        기본 보상 (웨이브 진행)
        <span className={cx("hint")}>
          {reward ? "등록됨" : "미등록"} · 지급량은 보상 기준의 일정으로 계산
        </span>
      </h2>
      <div className={cx("grid")}>
        {numberFields.map(({ key, label, hint, min }) => (
          <label key={key} className={cx("field")}>
            <span className={cx("fieldLabel")}>
              {label}
              <span className={cx("hint")}>{hint}</span>
            </span>
            <input
              type="number"
              className={cx("input")}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              onWheel={preventWheel}
              min={min}
              step={1}
              required
            />
          </label>
        ))}
      </div>

      <h3 className={cx("subTitle")}>
        보상 아이템
        <span className={cx("hint")}>
          20웨이브 완료 시 총수량 · 보상 기준에 분류된 itemId만 · 최소 수량은
          분류별 최소 총량
        </span>
      </h3>
      <RewardItemsEditor
        items={form.items}
        options={options}
        amountPlaceholder="총수량"
        rowHint={(itemId) =>
          rules?.items[itemId] ? `최소 ${minItemAmount(rules, itemId)}` : null
        }
        onChange={(items) => set("items", items)}
      />

      <div className={cx("footer")}>
        {message && <p className={cx("inlineError")}>{message}</p>}
        {onDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={busy !== null}
          >
            {busy === "delete" ? "삭제 중..." : "보상 삭제"}
          </Button>
        )}
        <Button type="submit" disabled={busy !== null || !rules}>
          {busy === "submit" ? "저장 중..." : reward ? "저장" : "보상 등록"}
        </Button>
      </div>
    </form>
  );
}
