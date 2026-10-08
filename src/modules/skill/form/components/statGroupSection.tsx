"use client";

import classnames from "classnames/bind";
import s from "../skillForm.module.scss";
import type { StatGroup } from "@/constants/skillStats";
import type { StatGroupState } from "../formState";

const cx = classnames.bind(s);

interface StatGroupSectionProps {
  group: StatGroup;
  state: StatGroupState;
  onChange: (state: StatGroupState) => void;
}

export default function StatGroupSection({ group, state, onChange }: StatGroupSectionProps) {
  return (
    <fieldset className={cx("group", { enabled: state.enabled })}>
      <label className={cx("groupHeader")}>
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
        />
        <span>{group.label}</span>
        <code className={cx("groupKey")}>{group.key}</code>
      </label>

      {state.enabled && (
        <div className={cx("fieldGrid")}>
          {group.fields.map((field) => (
            <label key={field.key} className={cx("field")}>
              <span className={cx("fieldLabel")}>
                {field.label}
                {field.ratio && <em className={cx("hint")}>0~1</em>}
              </span>
              <input
                type="number"
                className={cx("input")}
                value={state.values[field.key]}
                placeholder="비워두면 제외"
                step={field.type === "int" ? 1 : "any"}
                min={field.ratio ? 0 : undefined}
                max={field.ratio ? 1 : undefined}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) =>
                  onChange({ ...state, values: { ...state.values, [field.key]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
