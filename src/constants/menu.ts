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
      { label: "시전 타입 관리", path: "/skills/cast_types" },
      { label: "투사체 경로 관리", path: "/skills/projectile_paths" },
    ],
  },
  {
    label: "카드 관리",
    path: "/cards",
    children: [
      { label: "추가 능력치 관리", path: "/cards/stats" },
      { label: "효과 관리", path: "/cards/effects" },
      { label: "변형 관리", path: "/cards/transforms" },
    ],
  },
];
