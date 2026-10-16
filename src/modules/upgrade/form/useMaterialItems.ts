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
 * 장비 재료(targetId 없음) 아이템만 선택지로 보여준다.
 * 다른 강화가 이미 쓰는 아이템은 1재료-1장비 규칙 때문에 비활성화하고,
 * 현재 값이 목록에 없으면(스킬 재료·삭제된 아이템) 값이 사라지지 않게 남겨둔다.
 */
export const materialItemOptions = (
  items: Item[],
  upgrades: Upgrade[],
  upgradeId: string,
  current: string,
): MaterialItemOption[] => {
  const usedBy = new Map(
    upgrades
      .filter((u) => u.materialItemId && u.upgradeId !== upgradeId)
      .map((u) => [u.materialItemId!, u.upgradeId]),
  );

  const options = items
    .filter((item) => !item.targetId)
    .map((item) => {
      const owner = usedBy.get(item.itemId);
      return {
        itemId: item.itemId,
        label: owner ? `${item.itemId} (${owner}에서 사용 중)` : item.itemId,
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
