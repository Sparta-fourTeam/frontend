"use client";

import classnames from "classnames/bind";
import s from "../../components/upgrade.module.scss";
import Button from "@/components/common/Button";
import {
  emptyEffect,
  fitLevels,
  type EffectMode,
  type UpgradeEffectDraft,
} from "../upgradeFormState";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

const MODES: { value: EffectMode; label: string; hint: string }[] = [
  { value: "valuePerLevel", label: "레벨당 증가", hint: "valuePerLevel" },
  { value: "levelValues", label: "레벨별 지정", hint: "levelValues" },
];

interface UpgradeEffectEditorProps {
  effects: UpgradeEffectDraft[];
  levelCount: number;
  kindOptions: string[];
  onChange: (effects: UpgradeEffectDraft[]) => void;
}

export default function UpgradeEffectEditor({
  effects,
  levelCount,
  kindOptions,
  onChange,
}: UpgradeEffectEditorProps) {
  const update = (index: number, patch: Partial<UpgradeEffectDraft>) =>
    onChange(effects.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const move = (index: number, delta: number) => {
    const next = [...effects];
    next.splice(index + delta, 0, ...next.splice(index, 1));
    onChange(next);
  };

  const setLevel = (index: number, level: number, value: string) => {
    const levels = fitLevels(effects[index].levelValues, levelCount);
    levels[level] = value;
    update(index, { levelValues: levels });
  };

  // 레벨당 증가값으로 레벨별 값을 채운다 (Lv.n = 값 × n)
  const fillFromPerLevel = (index: number) => {
    const step = Number(effects[index].valuePerLevel);
    if (!Number.isFinite(step)) return;
    update(index, {
      levelValues: Array.from({ length: levelCount }, (_, i) =>
        String(step * (i + 1)),
      ),
    });
  };

  return (
    <div className={cx("effectList")}>
      <datalist id="upgrade-effect-kinds">
        {kindOptions.map((kind) => (
          <option key={kind} value={kind} />
        ))}
      </datalist>

      {effects.length === 0 && <p className={cx("muted")}>효과가 없습니다.</p>}

      {effects.map((effect, index) => (
        <div key={effect.key} className={cx("effectItem")}>
          <div className={cx("effectHead")}>
            <span className={cx("effectNo")}>{index + 1}</span>
            <input
              className={cx("input", "kindInput")}
              value={effect.kind}
              onChange={(e) => update(index, { kind: e.target.value })}
              list="upgrade-effect-kinds"
              placeholder="kind (예: attack)"
              aria-label="kind"
            />
            <Button
              size="small"
              variant="outline"
              onClick={() => move(index, -1)}
              disabled={index === 0}
            >
              ↑
            </Button>
            <Button
              size="small"
              variant="outline"
              onClick={() => move(index, 1)}
              disabled={index === effects.length - 1}
            >
              ↓
            </Button>
            <Button
              size="small"
              variant="danger"
              onClick={() => onChange(effects.filter((_, i) => i !== index))}
            >
              삭제
            </Button>
          </div>

          <div className={cx("chips")}>
            {MODES.map(({ value, label, hint }) => (
              <label
                key={value}
                className={cx("chip", "small", {
                  checked: effect.mode === value,
                })}
                title={hint}
              >
                <input
                  type="radio"
                  name={`${effect.key}-mode`}
                  checked={effect.mode === value}
                  onChange={() => update(index, { mode: value })}
                />
                {label}
                <span className={cx("chipHint")}>{hint}</span>
              </label>
            ))}
          </div>

          {effect.mode === "valuePerLevel" ? (
            <div className={cx("grid")}>
              <label className={cx("field")}>
                <span className={cx("fieldLabel")}>
                  valuePerLevel
                  <span className={cx("hint")}>레벨마다 더해지는 값</span>
                </span>
                <input
                  type="number"
                  className={cx("input")}
                  value={effect.valuePerLevel}
                  onChange={(e) =>
                    update(index, { valuePerLevel: e.target.value })
                  }
                  onWheel={preventWheel}
                  step={1}
                />
              </label>
            </div>
          ) : levelCount === 0 ? (
            <p className={cx("muted")}>
              최대 레벨을 먼저 입력하면 레벨별 입력칸이 생깁니다.
            </p>
          ) : (
            <>
              <div className={cx("levelGrid")}>
                {fitLevels(effect.levelValues, levelCount).map(
                  (value, level) => (
                    <label key={level} className={cx("levelField")}>
                      <span className={cx("levelLabel")}>Lv.{level + 1}</span>
                      <input
                        type="number"
                        className={cx("input", "levelInput")}
                        value={value}
                        onChange={(e) => setLevel(index, level, e.target.value)}
                        onWheel={preventWheel}
                        step={1}
                      />
                    </label>
                  ),
                )}
              </div>
              {effect.valuePerLevel.trim() !== "" && (
                <div>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => fillFromPerLevel(index)}
                  >
                    valuePerLevel({effect.valuePerLevel})로 채우기
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      <Button
        size="small"
        variant="outline"
        onClick={() => onChange([...effects, emptyEffect()])}
      >
        + 효과 추가
      </Button>
    </div>
  );
}
