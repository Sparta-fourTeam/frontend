"use client";

import { Fragment, useState } from "react";
import classnames from "classnames/bind";
import s from "./NameLabelManager.module.scss";
import Button from "@/components/common/Button";
import { isValidName, NAME_PATTERN, NAME_RULE, type NameLabelItem, type NameLabelRequest } from "@/apis/nameLabel";

const cx = classnames.bind(s);

interface NameLabelTableProps {
  items: NameLabelItem[];
  emptyText: string;
  onUpdate: (id: number, body: NameLabelRequest) => Promise<string | null>;
  onDelete: (item: NameLabelItem) => Promise<void>;
}

export default function NameLabelTable({
  items,
  emptyText,
  onUpdate,
  onDelete,
}: NameLabelTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<NameLabelRequest>({ name: "", label: "" });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const locked = busyId !== null;

  const startEdit = (item: NameLabelItem) => {
    setEditingId(item.id);
    setDraft({ name: item.name, label: item.label });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const save = async (id: number) => {
    if (locked) return;
    const body = { name: draft.name.trim(), label: draft.label.trim() };
    if (!isValidName(body.name)) return setEditError(NAME_RULE);
    if (body.label === "") return setEditError("표시 이름을 입력하세요.");

    setBusyId(id);
    const message = await onUpdate(id, body);
    setBusyId(null);
    if (message) return setEditError(message);
    cancelEdit();
  };

  const remove = async (item: NameLabelItem) => {
    if (locked) return;
    setBusyId(item.id);
    await onDelete(item);
    setBusyId(null);
  };

  if (items.length === 0) {
    return <p className={cx("empty")}>{emptyText}</p>;
  }

  return (
    <table className={cx("table")}>
      <thead>
        <tr>
          <th className={cx("colId")}>No.</th>
          <th>이름</th>
          <th>표시 이름</th>
          <th className={cx("colDate")}>수정일</th>
          <th className={cx("colActions")} />
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => {
          const editing = editingId === item.id;
          const busy = busyId === item.id;
          return (
            <Fragment key={item.id}>
              <tr>
                <td className={cx("muted")}>{index + 1}</td>
                <td>
                  {editing ? (
                    <input
                      className={cx("input", "inputSmall")}
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      pattern={NAME_PATTERN}
                      maxLength={30}
                      required
                    />
                  ) : (
                    <code className={cx("code")}>{item.name}</code>
                  )}
                </td>
                <td>
                  {editing ? (
                    <input
                      className={cx("input", "inputSmall")}
                      value={draft.label}
                      onChange={(e) =>
                        setDraft({ ...draft, label: e.target.value })
                      }
                      maxLength={255}
                      required
                    />
                  ) : (
                    item.label
                  )}
                </td>
                <td className={cx("muted")}>{formatDate(item.updatedAt)}</td>
                <td>
                  <div className={cx("actions")}>
                    {editing ? (
                      <>
                        <Button
                          size="small"
                          onClick={() => save(item.id)}
                          disabled={locked}
                        >
                          {busy ? "저장 중..." : "저장"}
                        </Button>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={locked}
                        >
                          취소
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => startEdit(item)}
                          disabled={locked}
                        >
                          수정
                        </Button>
                        <Button
                          size="small"
                          variant="danger"
                          onClick={() => remove(item)}
                          disabled={locked}
                        >
                          {busy ? "삭제 중..." : "삭제"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {editing && editError && (
                <tr>
                  <td colSpan={5} className={cx("rowError")}>
                    {editError}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// "2026-10-07T11:30:00" → "2026-10-07 11:30"
function formatDate(value: string) {
  return value ? value.slice(0, 16).replace("T", " ") : "-";
}
