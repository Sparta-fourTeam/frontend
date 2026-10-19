"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/rewardDefinition.module.scss";
import Button from "@/components/common/Button";
import RewardItemsEditor, {
  toRewardItemDrafts,
  validateRewardItemDrafts,
} from "@/components/common/RewardItemsEditor";
import type { Item } from "@/apis/item";
import {
  REFERENCE_LABELS,
  referenceCount,
  type RewardDefinition,
  type RewardDefinitionRequest,
} from "@/apis/rewardDefinition";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

interface RewardDefinitionFormProps {
  definition?: RewardDefinition;
  catalog: Item[];
  submitText: string;
  error?: string | null;
  onSubmit: (value: RewardDefinitionRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function RewardDefinitionForm({
  definition,
  catalog,
  submitText,
  error,
  onSubmit,
  onDelete,
}: RewardDefinitionFormProps) {
  const [name, setName] = useState(definition?.name ?? "");
  const [gold, setGold] = useState(definition ? String(definition.gold) : "");
  const [items, setItems] = useState(() =>
    toRewardItemDrafts(
      Object.entries(definition?.items ?? {}).map(([itemId, amount]) => ({
        itemId,
        amount,
      })),
    ),
  );
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const references = definition ? referenceCount(definition) : 0;
  // 도감 등급이 참조 중이면 서버가 "양수 골드만, 아이템 없음"만 허용한다.
  const codexLocked = (definition?.codexGradeReferences ?? 0) > 0;

  const validate = () => {
    if (!name.trim()) return "이름을 입력하세요.";
    if (name.trim().length > 100) return "이름은 100자 이하입니다.";
    if (!/^\d+$/.test(gold.trim())) return "골드는 0 이상의 정수입니다.";
    if (codexLocked && (Number(gold) <= 0 || items.length > 0))
      return "도감 등급이 참조 중인 묶음은 1 이상의 골드만 지급할 수 있습니다(아이템 불가).";
    return validateRewardItemDrafts(
      items,
      () => 1,
      (itemId) => catalog.some((item) => item.itemId === itemId),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validate();
    setFormError(invalid);
    if (invalid) return;
    setBusy("submit");
    await onSubmit({
      name: name.trim(),
      gold: Number(gold),
      items: Object.fromEntries(
        items.map((item) => [item.itemId, Number(item.amount)]),
      ),
      expectedVersion: definition?.version,
    });
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!onDelete || busy || references > 0) return;
    setBusy("delete");
    await onDelete();
    setBusy(null);
  };

  const message = formError ?? error;

  return (
    <form onSubmit={handleSubmit}>
      {definition && references > 0 && (
        <p className={cx("warning")}>
          {REFERENCE_LABELS.filter(({ key }) => definition[key] > 0)
            .map(({ key, label }) => `${label} ${definition[key]}곳`)
            .join(" · ")}
          에서 참조 중입니다. 저장하면 참조하는 모든 곳의 이후 수령에
          반영됩니다(이미 지급된 내역은 바뀌지 않음).
        </p>
      )}

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          기본 정보
          {definition && (
            <span className={cx("hint")}>버전 {definition.version}</span>
          )}
        </h2>
        <div className={cx("grid")}>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>이름 *</span>
            <input
              className={cx("input")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="예: 1-1 별 3개 최초 보상"
              required
            />
          </label>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>
              골드 *{codexLocked && <span className={cx("hint")}>1 이상</span>}
            </span>
            <input
              type="number"
              className={cx("input")}
              value={gold}
              onChange={(e) => setGold(e.target.value)}
              onWheel={preventWheel}
              min={codexLocked ? 1 : 0}
              step={1}
              required
            />
          </label>
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          보상 아이템
          <span className={cx("hint")}>
            실제 아이템만 · 수량 1 이상 · 중복 불가
            {codexLocked && " · 도감 등급 참조 중이라 추가 불가"}
          </span>
        </h2>
        <RewardItemsEditor
          items={items}
          options={catalog.map((item) => ({
            value: item.itemId,
            text: item.itemId,
          }))}
          amountPlaceholder="수량"
          minAmount={1}
          onChange={setItems}
        />
      </section>

      <div className={cx("footer")}>
        {message ? (
          <p className={cx("inlineError")}>{message}</p>
        ) : (
          onDelete &&
          references > 0 && (
            <p className={cx("footerNote")}>
              참조 중인 묶음은 삭제할 수 없습니다. 참조를 먼저 해제하세요.
            </p>
          )
        )}
        {onDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={busy !== null || references > 0}
          >
            {busy === "delete" ? "삭제 중..." : "삭제"}
          </Button>
        )}
        <Button type="submit" disabled={busy !== null}>
          {busy === "submit" ? "저장 중..." : submitText}
        </Button>
      </div>
    </form>
  );
}
