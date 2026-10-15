"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/card.module.scss";
import Button from "@/components/common/Button";
import EffectListEditor from "./components/effectListEditor";
import VariantListEditor from "./components/variantListEditor";
import {
  toFormState,
  toFormValue,
  validateCard,
  type CardFormState,
  type CardFormValue,
} from "./cardFormState";
import type { CardOptions } from "./useCardOptions";
import type { CardDetail } from "@/apis/card";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

type TextKey = "desc" | "disabledReason" | "sharedId";
type NumberKey = "maxPickCount" | "minBattleLevel" | "minPermanentLevel";

const NUMBER_FIELDS: {
  key: NumberKey;
  label: string;
  placeholder: string;
  min: number;
}[] = [
  {
    key: "maxPickCount",
    label: "최대 선택 횟수",
    placeholder: "비우면 1",
    min: 1,
  },
  {
    key: "minBattleLevel",
    label: "최소 전투 레벨",
    placeholder: "비우면 1",
    min: 1,
  },
  {
    key: "minPermanentLevel",
    label: "최소 영구 레벨",
    placeholder: "비우면 0",
    min: 0,
  },
];

interface CardFormProps {
  card?: CardDetail;
  options: CardOptions;
  submitText: string;
  error?: string | null;
  onSubmit: (value: CardFormValue) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function CardForm({
  card,
  options,
  submitText,
  error,
  onSubmit,
  onDelete,
}: CardFormProps) {
  const [form, setForm] = useState(() => toFormState(card));
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof CardFormState>(
    key: K,
    value: CardFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validateCard(form);
    setFormError(invalid);
    if (invalid) return;
    setBusy("submit");
    await onSubmit(toFormValue(form));
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    setBusy("delete");
    await onDelete();
    setBusy(null);
  };

  const textInput = (
    key: TextKey,
    label: string,
    placeholder?: string,
    disabled?: boolean,
  ) => (
    <label className={cx("field")}>
      <span className={cx("fieldLabel")}>{label}</span>
      <input
        className={cx("input")}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );

  const message = formError ?? error;

  return (
    <form onSubmit={handleSubmit}>
      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          기본 정보
          <span className={cx("hint")}>
            비워둔 칸은 null로 보내 서버 기본값을 사용합니다
          </span>
        </h2>
        <div className={cx("grid")}>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>이름 *</span>
            <input
              className={cx("input")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={255}
              required
            />
          </label>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>소속 스킬 *</span>
            <select
              className={cx("input")}
              value={form.skillId}
              onChange={(e) => set("skillId", e.target.value)}
              required
            >
              <option value="">선택</option>
              {options.skills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </label>
          {NUMBER_FIELDS.map(({ key, label, placeholder, min }) => (
            <label key={key} className={cx("field")}>
              <span className={cx("fieldLabel")}>{label}</span>
              <input
                type="number"
                className={cx("input")}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                onWheel={preventWheel}
                placeholder={placeholder}
                min={min}
                step={1}
              />
            </label>
          ))}
          {textInput("sharedId", "공유 ID", "비우면 없음")}
          <label className={cx("checkField")}>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set("enabled", e.target.checked)}
            />
            사용 (enabled)
          </label>
          {textInput(
            "disabledReason",
            "비활성 사유",
            "비활성일 때 입력",
            form.enabled,
          )}
          <label className={cx("field", "wide")}>
            <span className={cx("fieldLabel")}>설명</span>
            <textarea
              className={cx("input", "textarea")}
              value={form.desc}
              onChange={(e) => set("desc", e.target.value)}
              rows={2}
            />
          </label>
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          효과 (effects)
          <span className={cx("hint")}>
            위에서부터 순서대로 적용 · 체크한 파라미터만 입력
          </span>
        </h2>
        <EffectListEditor
          effects={form.effects}
          options={options}
          onChange={(effects) => set("effects", effects)}
        />
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          변형 (variants)
          <span className={cx("hint")}>
            가장 높은 충족 영구 레벨의 변형 사용 · 기본 카드와 선택 횟수 공유
          </span>
        </h2>
        <VariantListEditor
          variants={form.variants}
          options={options}
          onChange={(variants) => set("variants", variants)}
        />
      </section>

      <div className={cx("footer")}>
        {message && <p className={cx("inlineError")}>{message}</p>}
        {onDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={busy !== null}
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
