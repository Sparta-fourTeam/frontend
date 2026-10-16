"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/stage.module.scss";
import Button from "@/components/common/Button";
import {
  MIN_FINAL_COIN,
  SKILL_MATERIAL_MIN_AMOUNT,
  SKILL_MATERIAL_PREFIX,
  emptyRewardItem,
  toFormState,
  toRequest,
  validateReward,
  type RewardItemDraft,
  type StageRewardFormState,
} from "./stageRewardFormState";
import type { Item } from "@/apis/item";
import type { StageReward, StageRewardRequest } from "@/apis/stage";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

type NumberKey = "baseExp" | "threeStarBonusExp" | "finalCoin";

const NUMBER_FIELDS: {
  key: NumberKey;
  label: string;
  hint: string;
  min: number;
}[] = [
  {
    key: "baseExp",
    label: "baseExp *",
    hint: "웨이브 1개 이상 완료 시",
    min: 0,
  },
  {
    key: "threeStarBonusExp",
    label: "threeStarBonusExp *",
    hint: "별 3개 추가 경험치",
    min: 0,
  },
  {
    key: "finalCoin",
    label: "finalCoin *",
    hint: `20웨이브 총 코인 · ${MIN_FINAL_COIN} 이상`,
    min: MIN_FINAL_COIN,
  },
];

interface StageRewardFormProps {
  reward?: StageReward;
  items: Item[];
  submitText: string;
  error?: string | null;
  onSubmit: (value: StageRewardRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function StageRewardForm({
  reward,
  items,
  submitText,
  error,
  onSubmit,
  onDelete,
}: StageRewardFormProps) {
  const [form, setForm] = useState(() => toFormState(reward));
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof StageRewardFormState>(
    key: K,
    value: StageRewardFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (index: number, patch: Partial<RewardItemDraft>) =>
    set(
      "items",
      form.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validateReward(form);
    setFormError(invalid);
    if (invalid) return;
    setBusy("submit");
    await onSubmit(toRequest(form));
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    setBusy("delete");
    await onDelete();
    setBusy(null);
  };

  // 목록에 없는 기존 itemId도 선택지에 남겨 값이 사라지지 않게 한다.
  const itemOptions = (current: string) => {
    const options = items.map((item) => ({
      value: item.itemId,
      text: item.targetId ? `${item.itemId} (스킬 재료)` : item.itemId,
    }));
    if (current && !items.some((item) => item.itemId === current))
      options.unshift({ value: current, text: `${current} (없는 아이템)` });
    return options;
  };

  const message = formError ?? error;

  return (
    <form onSubmit={handleSubmit}>
      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          경험치 · 코인
          <span className={cx("hint")}>모두 필수 · 0 이상의 정수</span>
        </h2>
        <div className={cx("grid")}>
          {NUMBER_FIELDS.map(({ key, label, hint, min }) => (
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
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          보상 아이템 (items)
          <span className={cx("hint")}>
            20웨이브 완료 시 총수량 · 아이템 중복 불가 · {SKILL_MATERIAL_PREFIX}
            로 시작하면 {SKILL_MATERIAL_MIN_AMOUNT}개 이상
          </span>
        </h2>
        <div className={cx("itemList")}>
          {form.items.length === 0 && (
            <p className={cx("muted")}>보상 아이템이 없습니다.</p>
          )}
          {form.items.map((item, index) => (
            <div key={item.key} className={cx("itemRow")}>
              <span className={cx("itemNo")}>{index + 1}</span>
              <select
                className={cx("input", "itemSelect")}
                value={item.itemId}
                onChange={(e) => updateItem(index, { itemId: e.target.value })}
                aria-label="아이템"
              >
                <option value="">아이템 선택</option>
                {itemOptions(item.itemId).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.text}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className={cx("input", "amountInput")}
                value={item.finalAmount}
                onChange={(e) =>
                  updateItem(index, { finalAmount: e.target.value })
                }
                onWheel={preventWheel}
                placeholder="총수량"
                min={0}
                step={1}
                aria-label="총수량"
              />
              <Button
                size="small"
                variant="danger"
                onClick={() =>
                  set(
                    "items",
                    form.items.filter((_, i) => i !== index),
                  )
                }
              >
                삭제
              </Button>
            </div>
          ))}
          <Button
            size="small"
            variant="outline"
            onClick={() => set("items", [...form.items, emptyRewardItem()])}
          >
            + 아이템 추가
          </Button>
        </div>
      </section>

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
        <Button type="submit" disabled={busy !== null}>
          {busy === "submit" ? "저장 중..." : submitText}
        </Button>
      </div>
    </form>
  );
}
