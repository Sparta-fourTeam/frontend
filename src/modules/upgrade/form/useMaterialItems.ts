import { useEffect, useState } from "react";
import { getItems, type Item } from "@/apis/item";
import { getUpgrades, type Upgrade } from "@/apis/upgrade";

export interface MaterialItemOption {
  itemId: string;
  label: string;
  disabled: boolean;
}

// 재료 아이템 선택지를 만들 때 쓰는 아이템·강화 목록
export function useMaterialItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    Promise.all([getItems(), getUpgrades()])
      .then(([itemData, upgradeData]) => {
        if (ignore) return;
        setItems(itemData);
        setUpgrades(upgradeData);
      })
      .catch((e) => {
        if (!ignore)
          setError(
            e instanceof Error
              ? e.message
              : "아이템 목록을 불러오지 못했습니다.",
          );
      });
    return () => {
      ignore = true;
    };
  }, []);

  return { items, upgrades, error };
}

/**
 * 장비 재료로 쓸 수 있는 아이템만 선택지로 보여준다.
 * - targetId가 강화 id인 아이템(장비 재료)과 대상 없는 아이템
 * - 이 강화를 targetId로 가리키는 아이템을 맨 위에 둔다.
 * 다른 강화가 이미 쓰는 아이템은 1재료-1강화 규칙 때문에 비활성화하고,
 * 현재 값이 목록에 없으면(스킬 재료·삭제된 아이템) 값이 사라지지 않게 남겨둔다.
 */
export const materialItemOptions = (
  items: Item[],
  upgrades: Upgrade[],
  upgradeId: string,
  current: string,
): MaterialItemOption[] => {
  const upgradeIds = new Set(upgrades.map((u) => u.upgradeId));
  const usedBy = new Map(
    upgrades
      .filter((u) => u.materialItemId && u.upgradeId !== upgradeId)
      .map((u) => [u.materialItemId!, u.upgradeId]),
  );

  const candidates = items.filter(
    (item) => !item.targetId || upgradeIds.has(item.targetId),
  );
  // 이 강화를 대상으로 하는 아이템이 먼저 오도록 정렬
  const ordered = [
    ...candidates.filter((item) => upgradeId && item.targetId === upgradeId),
    ...candidates.filter((item) => !upgradeId || item.targetId !== upgradeId),
  ];

  const options = ordered.map((item) => {
    const owner = usedBy.get(item.itemId);
    const target = item.targetId ? ` → ${item.targetId}` : "";
    return {
      itemId: item.itemId,
      label: owner
        ? `${item.itemId}${target} (${owner}에서 사용 중)`
        : `${item.itemId}${target}`,
      disabled: !!owner,
    };
  });

  if (current && !options.some((o) => o.itemId === current)) {
    const item = items.find((i) => i.itemId === current);
    options.unshift({
      itemId: current,
      label: item ? `${current} (스킬 재료)` : `${current} (없는 아이템)`,
      disabled: false,
    });
  }
  return options;
};
