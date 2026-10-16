import { useEffect, useState } from "react";
import { getUpgrades } from "@/apis/upgrade";

// 이미 등록된 강화들의 효과 kind 목록 (입력 자동완성용)
export function useEffectKinds() {
  const [kinds, setKinds] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    getUpgrades()
      .then((upgrades) => {
        if (ignore) return;
        const all = upgrades.flatMap((u) =>
          (u.effects ?? []).map((e) => e.kind),
        );
        setKinds([...new Set(all)].sort());
      })
      .catch(() => {
        // 자동완성만 비워두고 폼은 그대로 사용한다.
      });
    return () => {
      ignore = true;
    };
  }, []);

  return kinds;
}
