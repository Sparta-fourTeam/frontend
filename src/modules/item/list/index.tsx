"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/item.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import { getItems, type Item } from "@/apis/item";
import {
  ITEM_TYPE_LABEL,
  itemTypeOf,
  linkedUpgrades,
  targetLabel,
  useItemOptions,
} from "../form/useItemOptions";

const cx = classnames.bind(s);

export default function ItemList() {
  const router = useRouter();
  const { options } = useItemOptions();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getItems()
      .then((data) => {
        if (!ignore) setItems(data);
      })
      .catch((e) => {
        if (!ignore)
          setError(
            e instanceof Error ? e.message : "목록을 불러오지 못했습니다.",
          );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title="아이템 관리"
          subtitle="아이템을 선택하면 상세 화면으로 이동합니다"
          align="left"
        />
        <Button onClick={() => router.push("/items/new")}>아이템 추가</Button>
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : items.length === 0 ? (
        !error && <p className={cx("empty")}>등록된 아이템이 없습니다.</p>
      ) : (
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("colNo")}>No.</th>
              <th>아이템 ID</th>
              <th>종류</th>
              <th>대상 (targetId)</th>
              <th>재료로 쓰는 강화</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const linked = linkedUpgrades(options.upgrades, item.itemId);
              return (
                <tr
                  key={item.itemId}
                  className={cx("clickable")}
                  onClick={() =>
                    router.push(`/items/${encodeURIComponent(item.itemId)}`)
                  }
                >
                  <td className={cx("muted")}>{index + 1}</td>
                  <td>
                    <span className={cx("code")}>{item.itemId}</span>
                  </td>
                  <td>{ITEM_TYPE_LABEL[itemTypeOf(options, item.targetId)]}</td>
                  <td>
                    {item.targetId ? (
                      <span className={cx("name")}>
                        {targetLabel(options, item.targetId)}
                      </span>
                    ) : (
                      <span className={cx("muted")}>-</span>
                    )}
                  </td>
                  <td>
                    {linked.length ? (
                      <div className={cx("tags")}>
                        {linked.map((upgradeId) => (
                          <span key={upgradeId} className={cx("tag")}>
                            {upgradeId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={cx("muted")}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
