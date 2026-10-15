import { STAT_GROUPS } from "@/constants/skillStats";
import type { SkillBaseStats } from "@/apis/skill";

export interface StatInfo {
  groupLabel?: string;
  fieldLabel?: string;
  ratio: boolean;
  isInt: boolean;
}

export type ParseResult =
  { ok: true; stats: SkillBaseStats } | { ok: false; error: string };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseStats = (text: string): ParseResult => {
  if (text.trim() === "") return { ok: true, stats: {} };

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : "";
    return { ok: false, error: `JSON 문법 오류입니다. ${detail}`.trim() };
  }
  if (!isPlainObject(data)) {
    return {
      ok: false,
      error: '최상위는 { "그룹": { "필드": 숫자 } } 형태의 객체여야 합니다.',
    };
  }

  const stats: SkillBaseStats = {};
  for (const [group, fields] of Object.entries(data)) {
    if (!isPlainObject(fields)) {
      return {
        ok: false,
        error: `"${group}" 그룹은 { "필드": 숫자 } 형태의 객체여야 합니다.`,
      };
    }
    stats[group] = {};
    for (const [field, value] of Object.entries(fields)) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return {
          ok: false,
          error: `${group}.${field} 값은 숫자여야 합니다. (현재: ${JSON.stringify(value)})`,
        };
      }
      stats[group][field] = value;
    }
  }
  return { ok: true, stats };
};

export const stringifyStats = (stats: SkillBaseStats) =>
  Object.keys(stats).length === 0 ? "" : JSON.stringify(stats, null, 2);

export const formatStatsText = (text: string) => {
  const result = parseStats(text);
  return result.ok ? stringifyStats(result.stats) : text;
};

export const describeStat = (group: string, field?: string): StatInfo => {
  const knownGroup = STAT_GROUPS.find((g) => g.key === group);
  const knownField = field
    ? knownGroup?.fields.find((f) => f.key === field)
    : undefined;
  return {
    groupLabel: knownGroup?.label,
    fieldLabel: knownField?.label,
    ratio: knownField?.ratio ?? false,
    isInt: knownField?.type === "int",
  };
};

export const statWarning = (group: string, field: string, value: number) => {
  const info = describeStat(group, field);
  if (info.ratio && (value < 0 || value > 1)) return "0~1 범위를 벗어났습니다";
  if (info.isInt && !Number.isInteger(value)) return "정수 필드입니다";
  return null;
};

export interface StatRow {
  group: string;
  field: string | null;
  value: number | null;
}

export const statsToRows = (stats: SkillBaseStats): StatRow[] =>
  Object.entries(stats).flatMap<StatRow>(([group, fields]) => {
    const entries = Object.entries(fields);
    if (entries.length === 0) return [{ group, field: null, value: null }];
    return entries.map(([field, value]) => ({ group, field, value }));
  });

export const rowsToStats = (rows: StatRow[]): SkillBaseStats => {
  const stats: SkillBaseStats = {};
  for (const row of rows) {
    stats[row.group] ??= {};
    if (row.field !== null && row.value !== null)
      stats[row.group][row.field] = row.value;
  }
  return stats;
};

export const STAT_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
