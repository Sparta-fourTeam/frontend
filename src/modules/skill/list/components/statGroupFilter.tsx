"use client";

import classnames from "classnames/bind";
import s from "../skillList.module.scss";
import { STAT_GROUPS, type StatGroupKey } from "@/constants/skillStats";

const cx = classnames.bind(s);

interface StatGroupFilterProps {
  selected: StatGroupKey[];
  onChange: (selected: StatGroupKey[]) => void;
}

export default function StatGroupFilter({ selected, onChange }: StatGroupFilterProps) {
  const toggle = (key: StatGroupKey) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <div className={cx("filter")}>
      <span className={cx("filterTitle")}>기본 수치</span>
      {STAT_GROUPS.map((group) => (
        <label
          key={group.key}
          className={cx("chip", { checked: selected.includes(group.key) })}
        >
          <input
            type="checkbox"
            checked={selected.includes(group.key)}
            onChange={() => toggle(group.key)}
          />
          {group.label}
        </label>
      ))}
      {selected.length > 0 && (
        <button type="button" className={cx("reset")} onClick={() => onChange([])}>
          초기화
        </button>
      )}
    </div>
  );
}
