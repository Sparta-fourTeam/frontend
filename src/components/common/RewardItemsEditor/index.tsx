"use client";

import classnames from "classnames/bind";
import s from "./RewardItemsEditor.module.scss";
import Button from "@/components/common/Button";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

export interface RewardItemDraft {
  key: string;
  itemId: string;
  amount: string;
}

export interface RewardItemOption {
  value: string;
  text: string;
}

let seq = 0;
export const emptyRewardItem = (): RewardItemDraft => ({
  key: `reward-item-${++seq}`,
  itemId: "",
  amount: "",
});

export const toRewardItemDrafts = (
  entries: { itemId: string; amount: number }[],
): RewardItemDraft[] =>
  entries.map((entry) => ({
    ...emptyRewardItem(),
    itemId: entry.itemId,
    amount: String(entry.amount),
  }));

interface RewardItemsEditorProps {
  items: RewardItemDraft[];
  options: RewardItemOption[];
  amountPlaceholder: string;
  minAmount?: number;
  // 행마다 보조 설명 (예: 최소 수량)
  rowHint?: (itemId: string) => string | null;
  onChange: (items: RewardItemDraft[]) => void;
}

// 아이템 선택 + 수량 입력 행 목록 (보상 묶음·스테이지 보상 공용)
export default function RewardItemsEditor({
  items,
  options,
  amountPlaceholder,
  minAmount = 0,
  rowHint,
  onChange,
}: RewardItemsEditorProps) {
  const update = (index: number, patch: Partial<RewardItemDraft>) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  // 선택지에 없는 기존 값도 남겨 화면을 여는 것만으로 값이 사라지지 않게 한다.
  const optionsFor = (current: string) =>
    current && !options.some((o) => o.value === current)
      ? [{ value: current, text: `${current} (목록에 없음)` }, ...options]
      : options;

  return (
    <div className={cx("list")}>
      {items.length === 0 && (
        <p className={cx("empty")}>보상 아이템이 없습니다.</p>
      )}
      {items.map((item, index) => {
        const hint = item.itemId ? rowHint?.(item.itemId) : null;
        return (
          <div key={item.key} className={cx("row")}>
            <span className={cx("no")}>{index + 1}</span>
            <select
              className={cx("input", "select")}
              value={item.itemId}
              onChange={(e) => update(index, { itemId: e.target.value })}
              aria-label="아이템"
            >
              <option value="">아이템 선택</option>
              {optionsFor(item.itemId).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
            <input
              type="number"
              className={cx("input", "amount")}
              value={item.amount}
              onChange={(e) => update(index, { amount: e.target.value })}
              onWheel={preventWheel}
              placeholder={amountPlaceholder}
              min={minAmount}
              step={1}
              aria-label={amountPlaceholder}
            />
            {rowHint && <span className={cx("rowHint")}>{hint ?? ""}</span>}
            <Button
              size="small"
              variant="danger"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              삭제
            </Button>
          </div>
        );
      })}
      <Button
        size="small"
        variant="outline"
        onClick={() => onChange([...items, emptyRewardItem()])}
      >
        + 아이템 추가
      </Button>
    </div>
  );
}

// 공통 검증: 선택 여부·중복·정수·최소값
export const validateRewardItemDrafts = (
  drafts: RewardItemDraft[],
  minAmount: (itemId: string) => number,
  isKnown?: (itemId: string) => boolean,
): string | null => {
  const seen = new Set<string>();
  for (const [i, draft] of drafts.entries()) {
    const label = `보상 아이템 ${i + 1}`;
    if (!draft.itemId) return `${label}: 아이템을 선택하세요.`;
    if (isKnown && !isKnown(draft.itemId))
      return `${label}: ${draft.itemId}은(는) 선택할 수 없는 아이템입니다.`;
    if (seen.has(draft.itemId))
      return `${label}: ${draft.itemId}이(가) 중복됩니다.`;
    seen.add(draft.itemId);
    if (!/^\d+$/.test(draft.amount.trim()))
      return `${label}: 수량은 정수로 입력하세요.`;
    const min = minAmount(draft.itemId);
    if (Number(draft.amount) < min)
      return `${label}: 수량은 ${min} 이상이어야 합니다.`;
  }
  return null;
};
