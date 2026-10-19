"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../components/item.module.scss";
import Button from "@/components/common/Button";
import {
  itemTypeOf,
  linkedUpgrades,
  type ItemOptions,
  type ItemType,
} from "./useItemOptions";
import type { Item, ItemCreateRequest } from "@/apis/item";

const cx = classnames.bind(s);

const TYPES: { value: ItemType; label: string; hint: string }[] = [
  { value: "skill", label: "스킬 재료", hint: "targetId = 스킬 id" },
  { value: "equipment", label: "장비 재료", hint: "targetId = 강화 id" },
  { value: "none", label: "대상 없음", hint: "상자 등 · targetId 없음" },
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
  const initialType = itemTypeOf(options, item?.targetId);
  const [itemId, setItemId] = useState(item?.itemId ?? "");
  const [type, setType] = useState<ItemType>(initialType);
  const [skillId, setSkillId] = useState(
    initialType === "skill" ? (item?.targetId ?? "") : "",
  );
  const [upgradeId, setUpgradeId] = useState(
    initialType === "equipment" ? (item?.targetId ?? "") : "",
  );
  const [busy, setBusy] = useState<"submit" | "delete" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // 강화의 재료로 연결된 경우(upgrade.materialItemId)
  const linked = linkedUpgrades(options.upgrades, itemId.trim());
  const deleteBlocked = !isCreate && linked.length > 0;
  // 목록에 없는 기존 스킬 id도 선택지에 남겨 값이 사라지지 않게 한다.
  const missingSkill =
    skillId !== "" && !options.skills.some((sk) => String(sk.id) === skillId);

  const validate = () => {
    if (isCreate && !itemId.trim()) return "아이템 ID를 입력하세요.";
    if (type === "skill" && !skillId) return "대상 스킬을 선택하세요.";
    if (type === "equipment" && !upgradeId) return "대상 강화를 선택하세요.";
    return null;
  };

  const targetId =
    type === "skill" ? skillId : type === "equipment" ? upgradeId : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validate();
    setFormError(invalid);
    if (invalid) return;
    setBusy("submit");
    await onSubmit({ itemId: itemId.trim(), targetId });
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
              placeholder="예: material.skill.fireball"
              disabled={!isCreate}
              required={isCreate}
            />
          </label>
        </div>
      </section>

      <section className={cx("card")}>
        <h2 className={cx("cardTitle")}>
          대상 (targetId)
          <span className={cx("hint")}>
            스킬 재료는 스킬 id, 장비 재료는 강화 id를 저장합니다
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

        {type !== "none" && (
          <div className={cx("section")}>
            <div className={cx("grid")}>
              {type === "skill" ? (
                <label className={cx("field")}>
                  <span className={cx("fieldLabel")}>대상 스킬 *</span>
                  <select
                    className={cx("input")}
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                  >
                    <option value="">선택</option>
                    {missingSkill && (
                      <option value={skillId}>{skillId} (없는 스킬)</option>
                    )}
                    {options.skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name} ({skill.id})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={cx("field")}>
                  <span className={cx("fieldLabel")}>대상 강화 *</span>
                  <select
                    className={cx("input")}
                    value={upgradeId}
                    onChange={(e) => setUpgradeId(e.target.value)}
                  >
                    <option value="">선택</option>
                    {options.upgrades.map((upgrade) => (
                      <option key={upgrade.upgradeId} value={upgrade.upgradeId}>
                        {upgrade.upgradeId}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}

        {linked.length > 0 && (
          <p className={cx("muted", "linkNote")}>
            재료로 사용 중인 강화: {linked.join(", ")}
          </p>
        )}
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
