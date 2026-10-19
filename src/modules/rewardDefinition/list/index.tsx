"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/rewardDefinition.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import {
  REFERENCE_LABELS,
  getRewardDefinitions,
  type RewardDefinition,
} from "@/apis/rewardDefinition";

const cx = classnames.bind(s);

export default function RewardDefinitionList() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<RewardDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getRewardDefinitions()
      .then((data) => {
        if (!ignore) setDefinitions([...data].sort((a, b) => a.id - b.id));
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
          title="고정 보상 묶음"
          subtitle="별등급·튜토리얼·퀘스트·상점·도감 보상에서 함께 쓰는 골드·아이템 묶음입니다"
          align="left"
        />
        <Button onClick={() => router.push("/reward-definitions/new")}>
          묶음 추가
        </Button>
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : definitions.length === 0 ? (
        !error && <p className={cx("empty")}>등록된 묶음이 없습니다.</p>
      ) : (
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("colNo")}>ID</th>
              <th>이름</th>
              <th>골드</th>
              <th>아이템</th>
              <th>참조</th>
              <th>버전</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((definition) => {
              const refs = REFERENCE_LABELS.filter(
                ({ key }) => definition[key] > 0,
              );
              const items = Object.entries(definition.items);
              return (
                <tr
                  key={definition.id}
                  className={cx("clickable")}
                  onClick={() =>
                    router.push(`/reward-definitions/${definition.id}`)
                  }
                >
                  <td className={cx("muted")}>{definition.id}</td>
                  <td className={cx("name")}>{definition.name}</td>
                  <td>{definition.gold}</td>
                  <td>
                    {items.length ? (
                      <div className={cx("tags")}>
                        {items.map(([itemId, amount]) => (
                          <span key={itemId} className={cx("tag")}>
                            {itemId} ×{amount}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={cx("muted")}>-</span>
                    )}
                  </td>
                  <td>
                    {refs.length ? (
                      <div className={cx("tags")}>
                        {refs.map(({ key, label }) => (
                          <span key={key} className={cx("tag")}>
                            {label} {definition[key]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className={cx("muted")}>없음</span>
                    )}
                  </td>
                  <td className={cx("muted")}>v{definition.version}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
