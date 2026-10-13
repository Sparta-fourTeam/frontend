"use client";

import classnames from "classnames/bind";
import s from "../../components/card.module.scss";
import Button from "@/components/common/Button";
import {
  EFFECT_PARAMS,
  emptyEffect,
  type EffectDraft,
  type EffectParam,
} from "../effectDraft";
import type { CardOptions } from "../useCardOptions";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

interface EffectListEditorProps {
  effects: EffectDraft[];
  options: CardOptions;
  onChange: (effects: EffectDraft[]) => void;
}

export default function EffectListEditor({
  effects,
  options,
  onChange,
}: EffectListEditorProps) {
  const update = (index: number, patch: Partial<EffectDraft>) =>
    onChange(effects.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const move = (index: number, delta: number) => {
    const next = [...effects];
    next.splice(index + delta, 0, ...next.splice(index, 1));
    onChange(next);
  };

  const toggle = (index: number, key: EffectParam) => {
    const params = effects[index].params;
    const next = params.includes(key)
      ? params.filter((p) => p !== key)
      : [...params, key];
    update(index, {
      params: EFFECT_PARAMS.map((p) => p.key).filter((k) => next.includes(k)),
    });
  };

  const choices = {
    skill: options.skills.map((skill) => ({
      value: String(skill.id),
      text: skill.name,
    })),
    form: options.forms.map((f) => ({
      value: f.name,
      text: `${f.label} (${f.name})`,
    })),
    trigger: options.triggers.map((t) => ({
      value: t.name,
      text: `${t.label} (${t.name})`,
    })),
  };

  return (
    <div className={cx("effectList")}>
      {effects.length === 0 && <p className={cx("muted")}>효과가 없습니다.</p>}

      {effects.map((effect, index) => {
        const setValue = (key: EffectParam, value: string) =>
          update(index, { values: { ...effect.values, [key]: value } });

        return (
          <div key={effect.key} className={cx("effectItem")}>
            <div className={cx("effectHead")}>
              <span className={cx("effectNo")}>{index + 1}</span>
              <select
                className={cx("input", "kindInput")}
                value={effect.kind}
                onChange={(e) => update(index, { kind: e.target.value })}
                aria-label="kind"
              >
                <option value="">kind 선택</option>
                {options.kinds.map((kind) => (
                  <option key={kind.id} value={kind.name}>
                    {kind.label} ({kind.name})
                  </option>
                ))}
              </select>
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
              {EFFECT_PARAMS.map(({ key, hint }) => {
                const checked = effect.params.includes(key);
                return (
                  <label
                    key={key}
                    className={cx("chip", "small", { checked })}
                    title={hint}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(index, key)}
                    />
                    {key}
                  </label>
                );
              })}
            </div>

            {effect.params.length > 0 && (
              <div className={cx("grid", "paramGrid")}>
                {EFFECT_PARAMS.filter((p) => effect.params.includes(p.key)).map(
                  ({ key, type, hint }) => {
                    if (type === "bool")
                      return (
                        <label key={key} className={cx("checkField")}>
                          <input
                            type="checkbox"
                            checked={effect.excludeHit}
                            onChange={(e) =>
                              update(index, { excludeHit: e.target.checked })
                            }
                          />
                          {key}
                        </label>
                      );

                    return (
                      <label key={key} className={cx("field")}>
                        <span className={cx("fieldLabel")}>
                          {key}
                          <span className={cx("hint")}>{hint}</span>
                        </span>
                        {type === "number" || type === "int" ? (
                          <input
                            type="number"
                            className={cx("input")}
                            value={effect.values[key] ?? ""}
                            onChange={(e) => setValue(key, e.target.value)}
                            onWheel={preventWheel}
                            step={type === "int" ? 1 : "any"}
                          />
                        ) : (
                          <select
                            className={cx("input")}
                            value={effect.values[key] ?? ""}
                            onChange={(e) => setValue(key, e.target.value)}
                          >
                            <option value="">선택</option>
                            {choices[type].map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.text}
                              </option>
                            ))}
                          </select>
                        )}
                      </label>
                    );
                  },
                )}
              </div>
            )}
          </div>
        );
      })}

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
