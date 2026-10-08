export type StatGroupKey =
  | "cast"
  | "projectile"
  | "reserve"
  | "status"
  | "explosion"
  | "area"
  | "chain"
  | "beam"
  | "field";

export interface StatField {
  key: string;
  label: string;
  type: "int" | "float";
  ratio?: boolean;
}

export interface StatGroup {
  key: StatGroupKey;
  label: string;
  fields: StatField[];
}

export const STAT_GROUPS: StatGroup[] = [
  {
    key: "cast",
    label: "시전",
    fields: [
      { key: "cooldown", label: "쿨다운", type: "float" },
      { key: "baseDamage", label: "기본 피해량", type: "float" },
      { key: "range", label: "사거리", type: "float" },
      { key: "projectileCount", label: "투사체 개수", type: "int" },
      { key: "castCount", label: "시전 횟수", type: "int" },
      { key: "castInterval", label: "시전 간격", type: "float" },
    ],
  },
  {
    key: "projectile",
    label: "투사체",
    fields: [
      { key: "speed", label: "속도", type: "float" },
      { key: "pierceCount", label: "관통 횟수", type: "int" },
      { key: "knockbackDistance", label: "넉백 거리", type: "float" },
    ],
  },
  {
    key: "reserve",
    label: "예비 공격",
    fields: [
      { key: "distance", label: "거리", type: "float" },
      { key: "cooldown", label: "쿨다운", type: "float" },
      { key: "interval", label: "간격", type: "float" },
    ],
  },
  {
    key: "status",
    label: "상태 이상",
    fields: [
      { key: "freezeDuration", label: "빙결 지속시간", type: "float" },
      { key: "freezeChance", label: "빙결 확률", type: "float", ratio: true },
      { key: "frostbiteChance", label: "동상 확률", type: "float", ratio: true },
      { key: "paralysisDuration", label: "마비 지속시간", type: "float" },
      { key: "paralysisChance", label: "마비 확률", type: "float", ratio: true },
      { key: "stunDuration", label: "기절 지속시간", type: "float" },
      { key: "stunChance", label: "기절 확률", type: "float", ratio: true },
      { key: "slowDuration", label: "감속 지속시간", type: "float" },
      { key: "slowRatio", label: "감속 비율", type: "float", ratio: true },
      { key: "burnChance", label: "점화 확률", type: "float", ratio: true },
    ],
  },
  {
    key: "explosion",
    label: "명중 폭발",
    fields: [
      { key: "radius", label: "폭발 반경", type: "float" },
      { key: "damageRatio", label: "피해 비율", type: "float" },
    ],
  },
  {
    key: "area",
    label: "영역 공격",
    fields: [
      { key: "radius", label: "반경", type: "float" },
      { key: "duration", label: "지속시간", type: "float" },
      { key: "pulseInterval", label: "틱 간격", type: "float" },
      { key: "moveSpeed", label: "이동 속도", type: "float" },
      { key: "pull", label: "끌어당김 힘", type: "float" },
    ],
  },
  {
    key: "chain",
    label: "연쇄 공격",
    fields: [
      { key: "bounces", label: "튕기는 횟수", type: "int" },
      { key: "jumpRange", label: "도약 사거리", type: "float" },
      { key: "hopInterval", label: "도약 간격", type: "float" },
      { key: "pathWidth", label: "경로 폭", type: "float" },
    ],
  },
  {
    key: "beam",
    label: "광선",
    fields: [
      { key: "length", label: "길이", type: "float" },
      { key: "width", label: "폭", type: "float" },
      { key: "duration", label: "지속시간", type: "float" },
      { key: "pulses", label: "틱 횟수", type: "int" },
    ],
  },
  {
    key: "field",
    label: "전자기장",
    fields: [
      { key: "damageRatio", label: "피해 비율", type: "float" },
      { key: "radius", label: "반경", type: "float" },
      { key: "slowRatio", label: "감속 비율", type: "float", ratio: true },
    ],
  },
];
