import Link from "next/link";
import classnames from "classnames/bind";
import s from "./skillList.module.scss";
import Title from "@/components/common/Title";

const cx = classnames.bind(s);

// TODO: 스킬 목록 API 생기면 교체
const DUMMY_SKILLS = [
  { id: 1, name: "임시 스킬 1" },
  { id: 2, name: "임시 스킬 2" },
  { id: 3, name: "임시 스킬 3" },
];

export default function SkillList() {
  return (
    <>
      <Title title="스킬 관리" subtitle="스킬을 선택하면 상세 화면으로 이동합니다" align="left" />
      <ul className={cx("list")}>
        {DUMMY_SKILLS.map((skill) => (
          <li key={skill.id}>
            <Link href={`/skills/${skill.id}`} className={cx("item")}>
              <span className={cx("id")}>#{skill.id}</span>
              {skill.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
