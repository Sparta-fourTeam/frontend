"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "./NameLabelManager.module.scss";
import Button from "@/components/common/Button";
import type { NameLabelItem, NameLabelRequest } from "@/apis/nameLabel";

const cx = classnames.bind(s);

interface NameLabelTableProps {
  items: NameLabelItem[];
  emptyText: string;
  onUpdate: (id: number, body: NameLabelRequest) => Promise<boolean>;
  onDelete: (item: NameLabelItem) => void;
}

// 목록 표
export default function NameLabelTable({
  items,
  emptyText,
  onUpdate,
  onDelete,
}: NameLabelTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<NameLabelRequest>({ name: "", label: "" });

  const startEdit = (item: NameLabelItem) => {
    setEditingId(item.id);
    setDraft({ name: item.name, label: item.label });
  };

  const save = async (id: number) => {
    const ok = await onUpdate(id, {
      name: draft.name.trim(),
      label: draft.label.trim(),
    });
    if (ok) setEditingId(null);
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
          return (
            <tr key={item.id}>
              {/* 순번 (id 가 아니라 화면에 보이는 순서) */}
              <td className={cx("muted")}>{index + 1}</td>
              <td>
                {editing ? (
                  <input
                    className={cx("input", "inputSmall")}
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                    maxLength={30}
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
                      <Button size="small" onClick={() => save(item.id)}>
                        저장
                      </Button>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => setEditingId(null)}
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
                      >
                        수정
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        onClick={() => onDelete(item)}
                      >
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
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
