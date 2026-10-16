"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../components/upgrade.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import { getUpgrades, type Upgrade } from "@/apis/upgrade";

const cx = classnames.bind(s);

const show = (value?: number | string | null) =>
  value == null || value === "" ? "-" : value;

export default function UpgradeList() {
  const router = useRouter();
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getUpgrades()
      .then((data) => {
        if (!ignore) setUpgrades(data);
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

  const goDetail = (upgradeId: string) =>
    router.push(`/upgrades/${encodeURIComponent(upgradeId)}`);

  return (
    <>
      <div className={cx("pageHeader")}>
        <Title
          title="강화 관리"
          subtitle="강화를 선택하면 상세 화면으로 이동합니다"
          align="left"
        />
        <Button onClick={() => router.push("/upgrades/new")}>강화 추가</Button>
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : upgrades.length === 0 ? (
        !error && <p className={cx("empty")}>등록된 강화가 없습니다.</p>
      ) : (
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("colNo")}>No.</th>
              <th>강화 ID</th>
              <th>최대 레벨</th>
              <th>해금 레벨</th>
              <th>비용 (base / step)</th>
              <th>재료 (base / step)</th>
              <th>효과</th>
            </tr>
          </thead>
          <tbody>
            {upgrades.map((upgrade, index) => (
              <tr
                key={upgrade.upgradeId}
                className={cx("clickable")}
                onClick={() => goDetail(upgrade.upgradeId)}
              >
                <td className={cx("muted")}>{index + 1}</td>
                <td>
                  <span className={cx("code")}>{upgrade.upgradeId}</span>
                </td>
                <td>{upgrade.maxLevel}</td>
                <td>{upgrade.unlockLevel}</td>
                <td>
                  {show(upgrade.costBase)} / {show(upgrade.costStep)}
                </td>
                <td>
                  {upgrade.materialItemId ? (
                    <>
                      <span className={cx("name")}>
                        {upgrade.materialItemId}
                      </span>{" "}
                      {show(upgrade.materialBase)} /{" "}
                      {show(upgrade.materialStep)}
                    </>
                  ) : (
                    <span className={cx("muted")}>-</span>
                  )}
                </td>
                <td>
                  {upgrade.effects?.length ? (
                    <div className={cx("tags")}>
                      {upgrade.effects.map((effect, i) => (
                        <span key={i} className={cx("tag")}>
                          {effect.kind}
                          {effect.valuePerLevel != null
                            ? ` +${effect.valuePerLevel}/Lv`
                            : " (레벨별)"}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className={cx("muted")}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
