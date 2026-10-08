"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "./skillList.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import StatGroupFilter from "./components/statGroupFilter";
import { getSkills, type SkillSummary } from "@/apis/skill";
import { STAT_GROUPS, type StatGroupKey } from "@/constants/skillStats";

const cx = classnames.bind(s);

export default function SkillList() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatGroupKey[]>([]);

  const filtered = skills.filter((skill) =>
    filter.every((key) => skill.statGroups?.includes(key)),
  );

  useEffect(() => {
    let ignore = false;
    getSkills()
      .then((data) => {
        if (!ignore) setSkills(data);
      })
      .catch((e) => {
        if (!ignore) setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
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
      <div className={cx("header")}>
        <Title title="스킬 관리" subtitle="스킬을 선택하면 상세 화면으로 이동합니다" align="left" />
        <Button onClick={() => router.push("/skills/new")}>스킬 추가</Button>
      </div>

      {error && <p className={cx("error")}>{error}</p>}

      <StatGroupFilter selected={filter} onChange={setFilter} />

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : skills.length === 0 ? (
        <p className={cx("empty")}>등록된 스킬이 없습니다.</p>
      ) : filtered.length === 0 ? (
        <p className={cx("empty")}>조건에 맞는 스킬이 없습니다.</p>
      ) : (
        <>
          {filter.length > 0 && (
            <p className={cx("count")}>
              {filtered.length}개 / 전체 {skills.length}개
            </p>
          )}
          <table className={cx("table")}>
            <thead>
              <tr>
                <th className={cx("colNo")}>No.</th>
                <th>이름</th>
                <th>시전 방식</th>
                <th>투사체 경로</th>
                <th>기본 수치</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((skill, index) => (
                <tr
                  key={skill.id}
                  className={cx("row")}
                  onClick={() => router.push(`/skills/${skill.id}`)}
                >
                  <td className={cx("muted")}>{index + 1}</td>
                  <td className={cx("name")}>{skill.name}</td>
                  <td>{skill.castType}</td>
                  <td>{skill.projectilePath}</td>
                  <td>
                    <div className={cx("tags")}>
                      {STAT_GROUPS.filter((g) => skill.statGroups?.includes(g.key)).map((g) => (
                        <span key={g.key} className={cx("tag")}>
                          {g.label}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
