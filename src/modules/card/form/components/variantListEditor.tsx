"use client";

import classnames from "classnames/bind";
import s from "../../components/card.module.scss";
import Button from "@/components/common/Button";
import EffectListEditor from "./effectListEditor";
import { newKey, type EffectDraft } from "../effectDraft";
import type { CardOptions } from "../useCardOptions";

const cx = classnames.bind(s);

export interface VariantDraft {
  key: string;
  id?: number;
  minPermanentLevel: string;
  name: string;
  desc: string;
  effects: EffectDraft[];
}

export const emptyVariant = (): VariantDraft => ({
  key: newKey(),
  minPermanentLevel: "",
  name: "",
  desc: "",
  effects: [],
});

interface VariantListEditorProps {
  variants: VariantDraft[];
  options: CardOptions;
  onChange: (variants: VariantDraft[]) => void;
}

export default function VariantListEditor({
  variants,
  options,
  onChange,
}: VariantListEditorProps) {
  const update = (index: number, patch: Partial<VariantDraft>) =>
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  return (
    <div className={cx("effectList")}>
      {variants.map((variant, index) => (
        <div key={variant.key} className={cx("variantItem")}>
          <div className={cx("grid")}>
            <label className={cx("field")}>
              <span className={cx("fieldLabel")}>
                영구 레벨 하한 *<span className={cx("hint")}>1 이상</span>
              </span>
              <input
                type="number"
                className={cx("input")}
                value={variant.minPermanentLevel}
                onChange={(e) =>
                  update(index, { minPermanentLevel: e.target.value })
                }
                onWheel={(e) => e.currentTarget.blur()}
                min={1}
                step={1}
                required
              />
            </label>
            <label className={cx("field")}>
              <span className={cx("fieldLabel")}>변형 이름 *</span>
              <input
                className={cx("input")}
                value={variant.name}
                onChange={(e) => update(index, { name: e.target.value })}
                required
              />
            </label>
            <label className={cx("field")}>
              <span className={cx("fieldLabel")}>변형 설명</span>
              <input
                className={cx("input")}
                value={variant.desc}
                onChange={(e) => update(index, { desc: e.target.value })}
              />
            </label>
            <div className={cx("variantActions")}>
              <Button
                size="small"
                variant="danger"
                onClick={() => onChange(variants.filter((_, i) => i !== index))}
              >
                변형 삭제
              </Button>
            </div>
          </div>
          <p className={cx("sectionLabel")}>
            변형 효과
            <span className={cx("hint")}>기본 효과 목록을 통째로 교체</span>
          </p>
          <EffectListEditor
            effects={variant.effects}
            options={options}
            onChange={(effects) => update(index, { effects })}
          />
        </div>
      ))}
      <Button
        size="small"
        variant="outline"
        onClick={() => onChange([...variants, emptyVariant()])}
      >
        + 변형 추가
      </Button>
    </div>
  );
}
