"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/item.module.scss";
import Button from "@/components/common/Button";
import { linkedUpgrades, type ItemOptions } from "./useItemOptions";
import type { Item, ItemCreateRequest } from "@/apis/item";

const cx = classnames.bind(s);

type ItemType = "equipment" | "skill";

const TYPES: { value: ItemType; label: string; hint: string }[] = [
  { value: "equipment", label: "장비 재료", hint: "강화에 사용" },
  { value: "skill", label: "스킬 재료", hint: "targetId = 스킬 id" },
];

interface ItemFormProps {
  item?: Item;
  options: ItemOptions;
  submitText: string;
  error?: string | null;
  onSubmit: (value: ItemCreateRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function ItemForm({
  item,
  options,
  submitText,
  error,
  onSubmit,
  onDelete,
}: ItemFormProps) {
  const isCreate = !item;
  const [itemId, setItemId] = useState(item?.itemId ?? "");
  const [type, setType] = useState<ItemType>(
    item?.targetId ? "skill" : "equipment",
  );
  const [targetId, setTargetId] = useState(item?.targetId ?? "");
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const linked = linkedUpgrades(options.upgrades, itemId.trim());
  // 강화 재료로 연결된 아이템은 서버에서 삭제를 막으므로 미리 비활성화한다.
  const deleteBlocked = !isCreate && linked.length > 0;
  // 목록에 없는 기존 targetId도 선택지에 남겨 값이 사라지지 않게 한다.
  const missingTarget =
    targetId !== "" && !options.skills.some((sk) => String(sk.id) === targetId);

  const validate = () => {
    if (isCreate && !itemId.trim()) return "아이템 ID를 입력하세요.";
    if (type === "skill" && !targetId) return "대상 스킬을 선택하세요.";
    if (type === "equipment" && linked.length > 1)
      return "하나의 재료는 하나의 강화에만 연결되어야 합니다.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validate();
    setFormError(invalid);
    if (invalid) return;
    setBusy("submit");
    await onSubmit({
      itemId: itemId.trim(),
      targetId: type === "skill" ? targetId : undefined,
    });
    setBusy(null);
  };

  const handleDelete = async () => {
    if (!onDelete || busy || deleteBlocked) return;
    setBusy("delete");
    await onDelete();
    setBusy(null);
  };

  const message = formError ?? error;

  return (
    <form onSubmit={handleSubmit}>
      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>기본 정보</h2>
        <div className={cx("grid")}>
          <label className={cx("field")}>
            <span className={cx("fieldLabel")}>
              아이템 ID *
              {!isCreate && <span className={cx("hint")}>수정 불가</span>}
            </span>
            <input
              className={cx("input")}
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              maxLength={255}
              placeholder="예: iron_ore"
              disabled={!isCreate}
              required={isCreate}
            />
          </label>
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          재료 종류
          <span className={cx("hint")}>
            스킬 재료는 targetId에 스킬 id를 저장합니다
          </span>
        </h2>
        <div className={cx("chips")}>
          {TYPES.map(({ value, label, hint }) => (
            <label
              key={value}
              className={cx("chip", { checked: type === value })}
            >
              <input
                type="radio"
                name="itemType"
                checked={type === value}
                onChange={() => setType(value)}
              />
              {label}
              <span className={cx("chipHint")}>{hint}</span>
            </label>
          ))}
        </div>

        <div className={cx("section")}>
          {type === "skill" ? (
            <div className={cx("grid")}>
              <label className={cx("field")}>
                <span className={cx("fieldLabel")}>대상 스킬 *</span>
                <select
                  className={cx("input")}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  <option value="">선택</option>
                  {missingTarget && (
                    <option value={targetId}>{targetId} (없는 스킬)</option>
                  )}
                  {options.skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.id})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <p className={linked.length > 1 ? cx("inlineError") : cx("muted")}>
              {linked.length === 0
                ? "이 아이템을 재료로 쓰는 강화가 없습니다."
                : `연결된 강화: ${linked.join(", ")}`}
            </p>
          )}
        </div>
      </section>

      <div className={cx("footer")}>
        {message ? (
          <p className={cx("inlineError")}>{message}</p>
        ) : (
          onDelete &&
          deleteBlocked && (
            <p className={cx("footerNote")}>
              강화({linked.join(", ")})의 재료로 연결되어 있어 삭제할 수
              없습니다. 강화에서 재료를 먼저 해제하세요.
            </p>
          )
        )}
        {onDelete && (
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={busy !== null || deleteBlocked}
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
