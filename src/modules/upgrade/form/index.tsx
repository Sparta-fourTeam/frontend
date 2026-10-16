"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/upgrade.module.scss";
import Button from "@/components/common/Button";
import UpgradeEffectEditor from "./components/upgradeEffectEditor";
import { useEffectKinds } from "./useEffectKinds";
import { materialItemOptions, useMaterialItems } from "./useMaterialItems";
import {
  levelCount,
  toFormState,
  toRequest,
  validateUpgrade,
  type NumberKey,
  type UpgradeFormState,
} from "./upgradeFormState";
import type { Upgrade, UpgradeCreateRequest } from "@/apis/upgrade";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

const LEVEL_FIELDS: {
  key: NumberKey;
  label: string;
  placeholder?: string;
  min: number;
  required?: boolean;
}[] = [
  { key: "maxLevel", label: "최대 레벨 *", min: 1, required: true },
  { key: "unlockLevel", label: "해금 레벨", placeholder: "비우면 1", min: 1 },
];

const COST_FIELDS: { key: NumberKey; label: string; hint: string }[] = [
  { key: "costBase", label: "costBase", hint: "기본 비용" },
  { key: "costStep", label: "costStep", hint: "레벨당 비용 증가" },
  { key: "materialBase", label: "materialBase", hint: "기본 재료 수" },
  { key: "materialStep", label: "materialStep", hint: "레벨당 재료 증가" },
];

interface UpgradeFormProps {
  upgrade?: Upgrade;
  submitText: string;
  error?: string | null;
  onSubmit: (value: UpgradeCreateRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function UpgradeForm({
  upgrade,
  submitText,
  error,
  onSubmit,
  onDelete,
}: UpgradeFormProps) {
  const isCreate = !upgrade;
  const kindOptions = useEffectKinds();
  const material = useMaterialItems();
  const [form, setForm] = useState(() => toFormState(upgrade));
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof UpgradeFormState>(
    key: K,
    value: UpgradeFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validateUpgrade(form, isCreate);
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

  const numberInput = (
    key: NumberKey,
    label: React.ReactNode,
    options: { placeholder?: string; min?: number; required?: boolean } = {},
  ) => (
    <label key={key} className={cx("field")}>
      <span className={cx("fieldLabel")}>{label}</span>
      <input
        type="number"
        className={cx("input")}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        onWheel={preventWheel}
        step={1}
        {...options}
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
            <span className={cx("fieldLabel")}>
              강화 ID *
              {!isCreate && <span className={cx("hint")}>수정 불가</span>}
            </span>
            <input
              className={cx("input")}
              value={form.upgradeId}
              onChange={(e) => set("upgradeId", e.target.value)}
              maxLength={255}
              placeholder="예: attack_up"
              disabled={!isCreate}
              required={isCreate}
            />
          </label>
          {LEVEL_FIELDS.map(({ key, label, ...options }) =>
            numberInput(key, label, options),
          )}
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          비용 · 재료
          <span className={cx("hint")}>0 이상의 정수 · 비우면 없음</span>
        </h2>
        {material.error && <p className={cx("error")}>{material.error}</p>}
        <div className={cx("grid")}>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>
              재료 아이템
              <span className={cx("hint")}>장비 재료만 표시</span>
            </span>
            <select
              className={cx("input")}
              value={form.materialItemId}
              onChange={(e) => set("materialItemId", e.target.value)}
            >
              <option value="">없음</option>
              {materialItemOptions(
                material.items,
                material.upgrades,
                form.upgradeId.trim(),
                form.materialItemId,
              ).map(({ itemId, label, disabled }) => (
                <option key={itemId} value={itemId} disabled={disabled}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {COST_FIELDS.map(({ key, label, hint }) =>
            numberInput(
              key,
              <>
                {label}
                <span className={cx("hint")}>{hint}</span>
              </>,
              { min: 0 },
            ),
          )}
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          효과 (effects)
          <span className={cx("hint")}>
            valuePerLevel · levelValues 중 하나 · levelValues는 최대 레벨 수만큼
          </span>
        </h2>
        <UpgradeEffectEditor
          effects={form.effects}
          levelCount={levelCount(form.maxLevel)}
          kindOptions={kindOptions}
          onChange={(effects) => set("effects", effects)}
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
