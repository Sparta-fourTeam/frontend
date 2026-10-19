// 사이드바 메뉴 목록
export interface MenuItem {
  label: string;
  path?: string;
  children?: MenuItem[];
}

export const MENU: MenuItem[] = [
  {
    label: "스킬 관리",
    path: "/skills",
    children: [
      { label: "시전 방식 관리", path: "/skills/cast-types" },
      { label: "투사체 경로 관리", path: "/skills/projectile-paths" },
      { label: "속성 관리", path: "/skills/elements" },
      {
        label: "카드 관리",
        path: "/cards",
        children: [
          { label: "효과 종류 관리", path: "/cards/effect-kinds" },
          { label: "효과 관리", path: "/cards/skill-forms" },
          { label: "효과 발동 시점 관리", path: "/cards/effect-triggers" },
        ],
      },
    ],
  },
  { label: "강화 관리", path: "/upgrades" },
  { label: "아이템 관리", path: "/items" },
  { label: "스테이지 관리", path: "/stages" },
  {
    label: "보상 관리",
    children: [
      { label: "보상 기준", path: "/reward-rules" },
      { label: "고정 보상 묶음", path: "/reward-definitions" },
    ],
  },
];
