"use client";

import { useState } from "react";
import classnames from "classnames/bind";
import s from "../links.module.scss";
import Button from "@/components/common/Button";
import type { CardSummary } from "@/apis/card";
import type { LinkEdge, LinkType } from "../linkModel";

const cx = classnames.bind(s);

interface LinkPanelProps {
  card: CardSummary;
  cards: CardSummary[];
  edges: LinkEdge[];
  onAdd: (
    type: LinkType,
    fromId: number,
    value?: number,
  ) => Promise<string | null>;
  onRemove: (edge: LinkEdge) => Promise<string | null>;
  onChangeValue: (edge: LinkEdge, value: number) => Promise<string | null>;
}

function ValueInput({
  edge,
  disabled,
  onCommit,
}: {
  edge: LinkEdge;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(edge.value));
  const min = edge.type === "required" ? 1 : 0;

  const commit = () => {
    const value = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(value) || value < min) {
      setDraft(String(edge.value));
      return;
    }
    if (value !== edge.value) onCommit(value);
  };

  return (
    <label className={cx("badge", "valueBadge")} title="값을 바꾸고 Enter">
      {edge.type === "required" ? "×" : "<"}
      <input
        type="number"
        className={cx("badgeInput")}
        value={draft}
        min={min}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setDraft(String(edge.value));
        }}
        onWheel={(e) => e.currentTarget.blur()}
        aria-label="값"
      />
    </label>
  );
}

const TYPE_META: Record<
  LinkType,
  { title: string; desc: string; valueLabel: string; placeholder: string }
> = {
  required: {
    title: "선행 카드",
    desc: "먼저 선택 성공해야 하는 카드",
    valueLabel: "필요 횟수",
    placeholder: "1",
  },
  exclusion: {
    title: "배제 카드",
    desc: "선택하면 이 카드를 막는 카드",
    valueLabel: "영구 레벨 미만",
    placeholder: "0",
  },
};

function LinkSection({
  type,
  card,
  cards,
  edges,
  onAdd,
  onRemove,
  onChangeValue,
}: LinkPanelProps & { type: LinkType }) {
  const meta = TYPE_META[type];
  const [fromId, setFromId] = useState("");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = edges.filter((e) => e.type === type && e.to === card.id);
  const nameOf = (id: number) => cards.find((c) => c.id === id);
  const candidates = cards.filter(
    (c) => c.id !== card.id && !mine.some((e) => e.from === c.id),
  );

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    const message = await action();
    setBusy(false);
    setError(message);
    return message;
  };

  const handleAdd = async () => {
    if (!fromId) return;
    const v = value.trim() === "" ? undefined : Number(value);
    if (
      type === "required" &&
      v !== undefined &&
      !(Number.isInteger(v) && v >= 1)
    ) {
      setError("필요 횟수는 1 이상입니다.");
      return;
    }
    if (type === "exclusion" && v !== undefined && !(v >= 0)) {
      setError("영구 레벨 기준은 0 이상입니다.");
      return;
    }
    const message = await run(() => onAdd(type, Number(fromId), v));
    if (!message) {
      setFromId("");
      setValue("");
    }
  };

  return (
    <div className={cx("section", type)}>
      <p className={cx("sectionTitle")}>
        {meta.title}
        <span className={cx("hint")}>{meta.desc}</span>
      </p>

      {mine.length === 0 ? (
        <p className={cx("muted")}>없음</p>
      ) : (
        <ul className={cx("linkList")}>
          {mine.map((edge) => {
            const from = nameOf(edge.from);
            return (
              <li key={edge.id}>
                <span>
                  {from?.name ?? edge.from}
                  {from && from.skillId !== card.skillId && (
                    <span className={cx("muted")}> · {from.skillName}</span>
                  )}
                </span>
                <ValueInput
                  key={`${edge.id}-${edge.value}`}
                  edge={edge}
                  disabled={busy}
                  onCommit={(value) => run(() => onChangeValue(edge, value))}
                />
                <Button
                  size="small"
                  variant="danger"
                  disabled={busy}
                  onClick={() => run(() => onRemove(edge))}
                >
                  삭제
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <div className={cx("addRow")}>
        <select
          className={cx("input")}
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
          aria-label={meta.title}
        >
          <option value="">카드 선택</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.skillName}
              {c.enabled ? "" : " (비활성)"}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={cx("input", "valueInput")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder={meta.placeholder}
          aria-label={meta.valueLabel}
          min={type === "required" ? 1 : 0}
        />
        <Button size="small" onClick={handleAdd} disabled={busy || !fromId}>
          추가
        </Button>
      </div>
      {error && <p className={cx("inlineError")}>{error}</p>}
    </div>
  );
}

export default function LinkPanel(props: LinkPanelProps) {
  return (
    <aside className={cx("panel")}>
      <h3 className={cx("panelTitle")}>{props.card.name}</h3>
      <LinkSection key={`r-${props.card.id}`} type="required" {...props} />
      <LinkSection key={`e-${props.card.id}`} type="exclusion" {...props} />
    </aside>
  );
}
