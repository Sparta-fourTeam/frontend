import { useEffect, useState } from "react";
import { getItems, type Item } from "@/apis/item";

// 보상 묶음에 넣을 수 있는 실제 아이템 목록
export function useCatalog() {
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getItems()
      .then((items) => {
        if (ignore) return;
        setCatalog(items);
        setLoaded(true);
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

  return { catalog, loaded, error };
}
