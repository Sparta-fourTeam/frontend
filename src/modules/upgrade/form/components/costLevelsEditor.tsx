"use client";

import classnames from "classnames/bind";
import s from "../../components/upgrade.module.scss";
import { fitLevels } from "../upgradeFormState";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

interface CostLevelsEditorProps {
  values: string[];
  levelCount: number;
  onChange: (values: string[]) => void;
}

// 현재 레벨 L → L+1 로 올릴 때의 비용을 레벨마다 입력 (maxLevel개, 1 이상)
export default function CostLevelsEditor({
  values,
  levelCount,
  onChange,
}: CostLevelsEditorProps) {
  if (levelCount === 0)
    return (
      <p className={cx("muted")}>
        최대 레벨을 먼저 입력하면 레벨별 입력칸이 생깁니다.
      </p>
    );

  const levels = fitLevels(values, levelCount);
  const setLevel = (index: number, value: string) => {
    const next = [...levels];
    next[index] = value;
    onChange(next);
  };

  return (
    <div className={cx("levelGrid")}>
      {levels.map((value, level) => (
        <label key={level} className={cx("levelField")}>
          <span className={cx("levelLabel")}>
            Lv.{level}→{level + 1}
          </span>
          <input
            type="number"
            className={cx("input", "levelInput")}
            value={value}
            onChange={(e) => setLevel(level, e.target.value)}
            onWheel={preventWheel}
            min={1}
            step={1}
          />
        </label>
      ))}
    </div>
  );
}
