"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "./skillList.module.scss";
import Title from "@/components/common/Title";
import Button from "@/components/common/Button";
import { getSkills, type SkillSummary } from "@/apis/skill";

const cx = classnames.bind(s);

export default function SkillList() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      {loading ? (
        <p className={cx("empty")}>불러오는 중...</p>
      ) : skills.length === 0 ? (
        <p className={cx("empty")}>등록된 스킬이 없습니다.</p>
      ) : (
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("colNo")}>No.</th>
              <th>이름</th>
              <th>시전 방식</th>
              <th>투사체 경로</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => (
              <tr
                key={skill.id}
                className={cx("row")}
                onClick={() => router.push(`/skills/${skill.id}`)}
              >
                <td className={cx("muted")}>{index + 1}</td>
                <td className={cx("name")}>{skill.name}</td>
                <td>{skill.castType}</td>
                <td>{skill.projectilePath}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
