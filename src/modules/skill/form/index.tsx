"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "./skillForm.module.scss";
import Button from "@/components/common/Button";
import StatGroupSection from "./components/statGroupSection";
import { STAT_GROUPS } from "@/constants/skillStats";
import { findEmptyGroups, formToRequest, type SkillFormState } from "./formState";
import type { SkillRequest } from "@/apis/skill";
import type { NameLabelItem } from "@/apis/nameLabel";

const cx = classnames.bind(s);

interface SkillFormProps {
  initial: SkillFormState;
  castTypes: NameLabelItem[];
  projectilePaths: NameLabelItem[];
  submitText: string;
  error?: string | null;
  onSubmit: (body: SkillRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) => e.currentTarget.blur();

export default function SkillForm({
  initial,
  castTypes,
  projectilePaths,
  submitText,
  error,
  onSubmit,
  onDelete,
}: SkillFormProps) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof SkillFormState>(
    key: K,
    value: SkillFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const emptyGroups = findEmptyGroups(form);
    if (emptyGroups.length > 0) {
      setFormError(
        `${emptyGroups.join(", ")} 그룹에 값을 하나 이상 입력하거나 체크를 해제하세요.`,
      );
      return;
    }

    setFormError(null);
    setBusy("submit");
    await onSubmit(formToRequest(form));
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;
    setBusy("delete");
    await onDelete();
    setBusy(null);
  };

  const message = formError ?? error;

  return (
    <form className={cx("form")} onSubmit={handleSubmit}>
      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>기본 정보</h2>
        <div className={cx("basicGrid")}>
          <label className={cx("field", "wide")}>
            <span className={cx("fieldLabel")}>이름 *</span>
            <input
              className={cx("input")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={255}
              required
            />
          </label>

          <label className={cx("field", "wide")}>
            <span className={cx("fieldLabel")}>설명</span>
            <textarea
              className={cx("input", "textarea")}
              value={form.desc}
              onChange={(e) => set("desc", e.target.value)}
              rows={3}
            />
          </label>

          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>시전 방식 *</span>
            <select
              className={cx("input")}
              value={form.castTypeId}
              onChange={(e) => set("castTypeId", e.target.value)}
              required
            >
              <option value="">선택</option>
              {castTypes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.name})
                </option>
              ))}
            </select>
          </label>

          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>투사체 경로 *</span>
            <select
              className={cx("input")}
              value={form.projectilePathId}
              onChange={(e) => set("projectilePathId", e.target.value)}
              required
            >
              <option value="">선택</option>
              {projectilePaths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.name})
                </option>
              ))}
            </select>
          </label>

          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>최대 레벨 *</span>
            <input
              type="number"
              className={cx("input")}
              value={form.maxLevel}
              onChange={(e) => set("maxLevel", e.target.value)}
              onWheel={preventWheel}
              min={1}
              step={1}
              required
            />
          </label>

          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>해금 레벨</span>
            <input
              type="number"
              className={cx("input")}
              value={form.unlockLevel}
              onChange={(e) => set("unlockLevel", e.target.value)}
              onWheel={preventWheel}
              placeholder="비워두면 1"
              min={1}
              step={1}
            />
          </label>

          <label className={cx("checkField")}>
            <input
              type="checkbox"
              checked={form.childOnly}
              onChange={(e) => set("childOnly", e.target.checked)}
            />
            자식 전용 스킬 (childOnly)
          </label>
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>기본 수치</h2>
        <p className={cx("cardDesc")}>
          사용하는 그룹만 체크하세요. 체크 안 한 그룹과 비워둔 칸은 요청에서
          빠집니다.
        </p>
        <div className={cx("groups")}>
          {STAT_GROUPS.map((group) => (
            <StatGroupSection
              key={group.key}
              group={group}
              state={form.groups[group.key]}
              onChange={(state) =>
                setForm((prev) => ({
                  ...prev,
                  groups: { ...prev.groups, [group.key]: state },
                }))
              }
            />
          ))}
        </div>
      </section>

      <div className={cx("footer")}>
        {message && <p className={cx("error")}>{message}</p>}
        {onDelete && (
          <Button variant="danger" onClick={handleDelete} disabled={busy !== null}>
            {busy === "delete" ? "삭제 중..." : "삭제"}
          </Button>
        )}
        <Button type="submit" disabled={busy !== null} className={cx("submit")}>
          {busy === "submit" ? "저장 중..." : submitText}
        </Button>
      </div>
    </form>
  );
}
