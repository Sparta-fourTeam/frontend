"use client";

import { useEffect, useState } from "react";
import classnames from "classnames/bind";
import s from "./rewardRules.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import { getItems, type Item } from "@/apis/item";
import {
  REWARD_KINDS,
  WAVE_COUNT,
  getRewardRules,
  minimumFinal,
  saveRewardRules,
  type RewardItemKind,
  type RewardKind,
  type RewardRules,
  type RewardRulesData,
} from "@/apis/rewardRules";

const cx = classnames.bind(s);

const preventWheel = (e: React.WheelEvent<HTMLInputElement>) =>
  e.currentTarget.blur();

const KIND_LABEL: Record<RewardKind, string> = {
  Coin: "코인",
  SkillMaterial: "스킬 재료",
  EquipmentMaterial: "장비 재료",
  GemChest: "젬 상자",
};

const ITEM_KINDS = REWARD_KINDS.filter(
  (kind): kind is RewardItemKind => kind !== "Coin",
);

type ScheduleKey = "start" | "perWave" | "bonusWave";

const SCHEDULE_FIELDS: { key: ScheduleKey; label: string; hint: string }[] = [
  { key: "start", label: "start", hint: "참가 시 기본량" },
  { key: "perWave", label: "perWave", hint: "웨이브당 증가" },
  {
    key: "bonusWave",
    label: "bonusWave",
    hint: `차액 지급 웨이브 1~${WAVE_COUNT}`,
  },
];

type ScheduleDraft = Record<ScheduleKey, string>;

interface RuleDraft {
  key: string;
  itemId: string;
  kind: RewardItemKind | "";
  random: boolean;
}

let seq = 0;
const newKey = () => `rule-${++seq}`;

const emptySchedules = (): Record<RewardKind, ScheduleDraft> =>
  Object.fromEntries(
    REWARD_KINDS.map((kind) => [
      kind,
      { start: "", perWave: "", bonusWave: "" },
    ]),
  ) as Record<RewardKind, ScheduleDraft>;

const toSchedules = (rules: RewardRules | null) =>
  rules
    ? (Object.fromEntries(
        REWARD_KINDS.map((kind) => {
          const schedule = rules.schedules[kind];
          return [
            kind,
            {
              start: String(schedule?.start ?? ""),
              perWave: String(schedule?.perWave ?? ""),
              bonusWave: String(schedule?.bonusWave ?? ""),
            },
          ];
        }),
      ) as Record<RewardKind, ScheduleDraft>)
    : emptySchedules();

const toRules = (rules: RewardRules | null): RuleDraft[] =>
  Object.entries(rules?.items ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([itemId, rule]) => ({
      key: newKey(),
      itemId,
      kind: rule.kind,
      random: rule.random,
    }));

const isInt = (value: string) => /^\d+$/.test(value.trim());

export default function RewardRulesEditor() {
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [version, setVersion] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [schedules, setSchedules] = useState(emptySchedules);
  const [rules, setRules] = useState<RuleDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const apply = (data: RewardRules | null) => {
    setConfigured(!!data);
    setVersion(data?.version ?? null);
    setSchedules(toSchedules(data));
    setRules(toRules(data));
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([getRewardRules(), getItems()])
      .then(([data, items]) => {
        if (ignore) return;
        apply(data);
        setCatalog(items);
        setLoaded(true);
      })
      .catch((e) => {
        if (!ignore)
          setLoadError(
            e instanceof Error ? e.message : "보상 기준을 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, []);

  const setSchedule = (kind: RewardKind, key: ScheduleKey, value: string) =>
    setSchedules((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], [key]: value },
    }));

  const updateRule = (index: number, patch: Partial<RuleDraft>) =>
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    );

  const validate = (): string | null => {
    for (const kind of REWARD_KINDS) {
      const draft = schedules[kind];
      const label = KIND_LABEL[kind];
      if (!isInt(draft.start) || !isInt(draft.perWave))
        return `${label}: start·perWave는 0 이상의 정수입니다.`;
      const bonus = Number(draft.bonusWave);
      if (!isInt(draft.bonusWave) || bonus < 1 || bonus > WAVE_COUNT)
        return `${label}: bonusWave는 1~${WAVE_COUNT} 사이 정수입니다.`;
    }
    const seen = new Set<string>();
    for (const [i, rule] of rules.entries()) {
      const label = `아이템 분류 ${i + 1}`;
      const itemId = rule.itemId.trim();
      if (!itemId) return `${label}: itemId를 입력하세요.`;
      if (itemId.startsWith("currency."))
        return `${label}: currency.로 시작하는 ID는 쓸 수 없습니다.`;
      if (seen.has(itemId)) return `${label}: ${itemId}이(가) 중복됩니다.`;
      seen.add(itemId);
      if (!rule.kind) return `${label}: 종류를 선택하세요.`;
      if (rule.random && rule.kind === "GemChest")
        return `${label}: 젬 상자는 랜덤 추첨으로 지정할 수 없습니다.`;
      if (!rule.random && !catalog.some((item) => item.itemId === itemId))
        return `${label}: ${itemId}은(는) 없는 아이템입니다. 랜덤 추첨 ID라면 '랜덤'을 체크하세요.`;
    }
    return null;
  };

  const handleSave = async () => {
    if (busy) return;
    setNotice(null);
    const invalid = validate();
    setMessage(invalid);
    if (invalid) return;
    const body: RewardRulesData = {
      schedules: Object.fromEntries(
        REWARD_KINDS.map((kind) => [
          kind,
          {
            start: Number(schedules[kind].start),
            perWave: Number(schedules[kind].perWave),
            bonusWave: Number(schedules[kind].bonusWave),
          },
        ]),
      ) as RewardRulesData["schedules"],
      items: Object.fromEntries(
        rules.map((rule) => [
          rule.itemId.trim(),
          { kind: rule.kind as RewardItemKind, random: rule.random },
        ]),
      ),
    };
    setBusy(true);
    try {
      apply(await saveRewardRules(body));
      setNotice("보상 기준을 저장했습니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장에 실패했습니다.");
    }
    setBusy(false);
  };

  const finalOf = (kind: RewardKind) => {
    const draft = schedules[kind];
    return isInt(draft.start) && isInt(draft.perWave)
      ? minimumFinal({
          start: Number(draft.start),
          perWave: Number(draft.perWave),
          bonusWave: 1,
        })
      : null;
  };

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title="보상 기준"
          subtitle={`스테이지 웨이브 보상의 지급 일정과 아이템 분류${version != null ? ` · 버전 ${version}` : ""}`}
          align="left"
        />
      </div>

      {loadError && <p className={cx("error")}>{loadError}</p>}
      {loaded && !configured && (
        <p className={cx("warning")}>
          아직 보상 기준이 설정되지 않았습니다. 설정 전에는 스테이지 보상을
          등록하거나 계산할 수 없습니다.
        </p>
      )}
      {notice && <p className={cx("notice")}>{notice}</p>}

      {!loaded ? (
        !loadError && <p className={cx("empty")}>불러오는 중...</p>
      ) : (
        <>
          <section className={cx("card")}>
            <h2 className={cx("cardTitle")}>
              지급 일정 (schedules)
              <span className={cx("hint")}>
                완료 웨이브 W의 지급량 = start + perWave × W (+ W ≥ bonusWave면
                총량과의 차액)
              </span>
            </h2>
            <table className={cx("table", "scheduleTable")}>
              <thead>
                <tr>
                  <th>종류</th>
                  {SCHEDULE_FIELDS.map(({ key, label, hint }) => (
                    <th key={key}>
                      {label} <span className={cx("hint")}>{hint}</span>
                    </th>
                  ))}
                  <th>
                    최소 총량{" "}
                    <span className={cx("hint")}>start + perWave × 20</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {REWARD_KINDS.map((kind) => (
                  <tr key={kind}>
                    <td className={cx("name")}>
                      {KIND_LABEL[kind]}{" "}
                      <span className={cx("muted")}>{kind}</span>
                    </td>
                    {SCHEDULE_FIELDS.map(({ key }) => (
                      <td key={key}>
                        <input
                          type="number"
                          className={cx("input")}
                          value={schedules[kind][key]}
                          onChange={(e) =>
                            setSchedule(kind, key, e.target.value)
                          }
                          onWheel={preventWheel}
                          min={key === "bonusWave" ? 1 : 0}
                          max={key === "bonusWave" ? WAVE_COUNT : undefined}
                          step={1}
                          aria-label={`${kind} ${key}`}
                        />
                      </td>
                    ))}
                    <td>{finalOf(kind) ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className={cx("card")}>
            <h2 className={cx("cardTitle")}>
              아이템 분류 (items)
              <span className={cx("hint")}>
                스테이지 보상에 넣을 수 있는 itemId · 랜덤이면 실제 아이템이
                아닌 추첨 ID(종료 시 실제 재료로 확정)
              </span>
            </h2>
            <datalist id="reward-rule-items">
              {catalog.map((item) => (
                <option key={item.itemId} value={item.itemId} />
              ))}
            </datalist>
            <div className={cx("itemList")}>
              {rules.length === 0 && (
                <p className={cx("muted")}>분류된 아이템이 없습니다.</p>
              )}
              {rules.map((rule, index) => (
                <div key={rule.key} className={cx("ruleRow")}>
                  <span className={cx("itemNo")}>{index + 1}</span>
                  <input
                    className={cx("input", "ruleId")}
                    value={rule.itemId}
                    onChange={(e) =>
                      updateRule(index, { itemId: e.target.value })
                    }
                    list={rule.random ? undefined : "reward-rule-items"}
                    placeholder={rule.random ? "추첨 ID" : "아이템 ID"}
                    aria-label="itemId"
                  />
                  <select
                    className={cx("input", "ruleKind")}
                    value={rule.kind}
                    onChange={(e) => {
                      const kind = e.target.value as RewardItemKind | "";
                      // 젬 상자는 랜덤 추첨이 될 수 없다.
                      updateRule(index, {
                        kind,
                        random: kind === "GemChest" ? false : rule.random,
                      });
                    }}
                    aria-label="종류"
                  >
                    <option value="">종류 선택</option>
                    {ITEM_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {KIND_LABEL[kind]} ({kind})
                      </option>
                    ))}
                  </select>
                  <label className={cx("checkField")}>
                    <input
                      type="checkbox"
                      checked={rule.random}
                      disabled={rule.kind === "GemChest"}
                      onChange={(e) =>
                        updateRule(index, { random: e.target.checked })
                      }
                    />
                    랜덤
                  </label>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() =>
                      setRules((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    삭제
                  </Button>
                </div>
              ))}
              <Button
                size="small"
                variant="outline"
                onClick={() =>
                  setRules((prev) => [
                    ...prev,
                    { key: newKey(), itemId: "", kind: "", random: false },
                  ])
                }
              >
                + 아이템 분류 추가
              </Button>
            </div>
          </section>

          <div className={cx("footer")}>
            {message && <p className={cx("inlineError")}>{message}</p>}
            <Button onClick={handleSave} disabled={busy}>
              {busy ? "저장 중..." : configured ? "저장" : "보상 기준 등록"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
