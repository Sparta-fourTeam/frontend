"use client";

import { useMemo, useState } from "react";
import classnames from "classnames/bind";
import s from "./baseStatsEditor.module.scss";
import Button from "@/components/common/Button";
import { STAT_GROUPS } from "@/constants/skillStats";
import {
  STAT_KEY_PATTERN,
  describeStat,
  formatStatsText,
  parseStats,
  rowsToStats,
  statWarning,
  statsToRows,
  stringifyStats,
  type StatRow,
} from "../baseStats";

const cx = classnames.bind(s);

interface BaseStatsEditorProps {
  text: string;
  onChange: (text: string) => void;
}

const KEY_RULE = "영문으로 시작하고 영문, 숫자, 밑줄만 쓸 수 있습니다.";

export default function BaseStatsEditor({
  text,
  onChange,
}: BaseStatsEditorProps) {
  const parsed = useMemo(() => parseStats(text), [text]);
  const rows = useMemo(
    () => (parsed.ok ? statsToRows(parsed.stats) : null),
    [parsed],
  );
  const [message, setMessage] = useState<string | null>(null);

  const commitRows = (next: StatRow[]) => {
    setMessage(null);
    onChange(stringifyStats(rowsToStats(next)));
  };

  const hasRow = (group: string, field: string, except: number) =>
    rows?.some(
      (r, i) => i !== except && r.group === group && r.field === field,
    ) ?? false;

  const updateRow = (index: number, patch: Partial<StatRow>) => {
    if (!rows) return false;
    const row = { ...rows[index], ...patch };
    if (
      !STAT_KEY_PATTERN.test(row.group) ||
      (row.field !== null && !STAT_KEY_PATTERN.test(row.field))
    ) {
      setMessage(`그룹·필드 이름은 ${KEY_RULE}`);
      return false;
    }
    if (row.field !== null && hasRow(row.group, row.field, index)) {
      setMessage(`${row.group}.${row.field}는 이미 있습니다.`);
      return false;
    }
    commitRows(rows.map((r, i) => (i === index ? row : r)));
    return true;
  };

  const renameGroup = (from: string, to: string) => {
    if (!rows) return false;
    if (!STAT_KEY_PATTERN.test(to)) {
      setMessage(`그룹 이름은 ${KEY_RULE}`);
      return false;
    }
    const conflicts = rows
      .filter((r) => r.group === from && r.field !== null)
      .filter((r) => rows.some((o) => o.group === to && o.field === r.field))
      .map((r) => r.field);
    if (conflicts.length > 0) {
      setMessage(
        `${to} 그룹에 이미 ${conflicts.join(", ")} 필드가 있어 합칠 수 없습니다.`,
      );
      return false;
    }
    commitRows(rows.map((r) => (r.group === from ? { ...r, group: to } : r)));
    return true;
  };

  const groupCount = rows ? new Set(rows.map((r) => r.group)).size : 0;
  const fieldCount = rows ? rows.filter((r) => r.field !== null).length : 0;

  return (
    <div className={cx("editor")}>
      <div className={cx("jsonPane")}>
        <textarea
          className={cx("json", { invalid: !parsed.ok })}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={'{\n  "cast": { "cooldown": 2, "baseDamage": 12 }\n}'}
        />
        <div className={cx("jsonFooter")}>
          <div className={cx("jsonActions")}>
            <Button
              variant="outline"
              size="small"
              onClick={() => onChange(formatStatsText(text))}
              disabled={!parsed.ok}
            >
              정렬
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => onChange("")}
              disabled={text === ""}
            >
              비우기
            </Button>
          </div>
          {parsed.ok ? (
            <span className={cx("status")}>
              {groupCount === 0
                ? "입력된 수치 없음"
                : `그룹 ${groupCount}개 · 필드 ${fieldCount}개`}
            </span>
          ) : (
            <span className={cx("status", "error")}>{parsed.error}</span>
          )}
        </div>
      </div>

      <div className={cx("previewPane")}>
        {!rows ? (
          <p className={cx("placeholder")}>
            JSON 오류를 고치면 표가 다시 표시됩니다.
          </p>
        ) : (
          <>
            <table className={cx("table")}>
              <thead>
                <tr>
                  <th className={cx("colKey")}>그룹</th>
                  <th className={cx("colKey")}>필드</th>
                  <th className={cx("colValue")}>값</th>
                  <th>설명</th>
                  <th className={cx("colAction")} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className={cx("emptyRow")}>
                      입력된 수치가 없습니다. 아래에서 추가하거나 JSON을 붙여
                      넣으세요.
                    </td>
                  </tr>
                )}
                {rows.map((row, index) => {
                  const info = describeStat(row.group, row.field ?? undefined);
                  const warning =
                    row.field !== null && row.value !== null
                      ? statWarning(row.group, row.field, row.value)
                      : null;
                  const firstOfGroup =
                    index === 0 || rows[index - 1].group !== row.group;
                  const groupSize = rows.filter(
                    (r) => r.group === row.group,
                  ).length;
                  return (
                    <tr
                      key={`${row.group}.${row.field ?? ""}`}
                      className={cx({ groupStart: firstOfGroup && index > 0 })}
                    >
                      {firstOfGroup && (
                        <td
                          className={cx("colKey", "groupCell")}
                          rowSpan={groupSize}
                        >
                          <Cell
                            value={row.group}
                            list="base-stat-groups"
                            onCommit={(group) => renameGroup(row.group, group)}
                          />
                        </td>
                      )}
                      <td className={cx("colKey")}>
                        {row.field === null ? (
                          <span className={cx("muted")}>필드 없음</span>
                        ) : (
                          <Cell
                            value={row.field}
                            list={`base-stat-fields-${row.group}`}
                            onCommit={(field) => updateRow(index, { field })}
                          />
                        )}
                      </td>
                      <td className={cx("colValue")}>
                        {row.value !== null && (
                          <Cell
                            numeric
                            value={String(row.value)}
                            onCommit={(value) =>
                              updateRow(index, { value: Number(value) })
                            }
                          />
                        )}
                      </td>
                      <td className={cx("desc")}>
                        {info.groupLabel ?? (
                          <em className={cx("newTag")}>새 그룹</em>
                        )}
                        {row.field !== null && (
                          <>
                            <span className={cx("sep")}>·</span>
                            {info.fieldLabel ?? (
                              <em className={cx("newTag")}>새 필드</em>
                            )}
                          </>
                        )}
                        {warning && (
                          <span className={cx("warning")}>{warning}</span>
                        )}
                      </td>
                      <td className={cx("colAction")}>
                        <button
                          type="button"
                          className={cx("remove")}
                          title="행 삭제"
                          onClick={() =>
                            commitRows(rows.filter((_, i) => i !== index))
                          }
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <AddRow
                exists={(g, f) => hasRow(g, f, -1)}
                onAdd={(group, field, value) =>
                  commitRows([...rows, { group, field, value }])
                }
              />
            </table>
            {message && <p className={cx("tableError")}>{message}</p>}
            <datalist id="base-stat-groups">
              {STAT_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </datalist>
            {STAT_GROUPS.map((g) => (
              <datalist key={g.key} id={`base-stat-fields-${g.key}`}>
                {g.fields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </datalist>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

interface CellProps {
  value: string;
  numeric?: boolean;
  list?: string;
  onCommit: (value: string) => boolean;
}

function Cell(props: CellProps) {
  return <CellInput key={props.value} {...props} />;
}

function CellInput({ value, numeric, list, onCommit }: CellProps) {
  const [draft, setDraft] = useState(value);

  const commit = () => {
    const next = draft.trim();
    if (next === value) return;
    const valid = numeric
      ? next !== "" && Number.isFinite(Number(next))
      : next !== "";
    if (!valid || !onCommit(next)) setDraft(value);
  };

  return (
    <input
      className={cx("cell", { numeric })}
      type={numeric ? "number" : "text"}
      step={numeric ? "any" : undefined}
      list={list}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") setDraft(value);
      }}
      onWheel={numeric ? (e) => e.currentTarget.blur() : undefined}
    />
  );
}

function AddRow({
  exists,
  onAdd,
}: {
  exists: (group: string, field: string) => boolean;
  onAdd: (group: string, field: string, value: number) => void;
}) {
  const [group, setGroup] = useState("");
  const [field, setField] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const g = group.trim();
    const f = field.trim();
    const v = Number(value);
    if (!STAT_KEY_PATTERN.test(g) || !STAT_KEY_PATTERN.test(f)) {
      setError(`그룹·필드 이름은 ${KEY_RULE}`);
      return;
    }
    if (value.trim() === "" || !Number.isFinite(v)) {
      setError("값에 숫자를 입력하세요.");
      return;
    }
    if (exists(g, f)) {
      setError(`${g}.${f}는 이미 있습니다. 표에서 값을 고치세요.`);
      return;
    }
    onAdd(g, f, v);
    setField("");
    setValue("");
    setError(null);
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <tfoot>
      <tr className={cx("addRow")}>
        <td className={cx("colKey")}>
          <input
            className={cx("cell", "addCell")}
            value={group}
            list="base-stat-groups"
            placeholder="그룹"
            onChange={(e) => setGroup(e.target.value)}
            onKeyDown={onEnter}
          />
        </td>
        <td className={cx("colKey")}>
          <input
            className={cx("cell", "addCell")}
            value={field}
            list={`base-stat-fields-${group.trim()}`}
            placeholder="필드"
            onChange={(e) => setField(e.target.value)}
            onKeyDown={onEnter}
          />
        </td>
        <td className={cx("colValue")}>
          <input
            type="number"
            step="any"
            className={cx("cell", "addCell", "numeric")}
            value={value}
            placeholder="값"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onEnter}
            onWheel={(e) => e.currentTarget.blur()}
          />
        </td>
        <td colSpan={2}>
          <Button size="small" onClick={add}>
            행 추가
          </Button>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className={cx("tableError")}>
            {error}
          </td>
        </tr>
      )}
    </tfoot>
  );
}
