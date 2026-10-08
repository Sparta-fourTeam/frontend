"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../list/skillList.module.scss";
import Title from "@/components/common/Title";
import SkillForm from "../form";
import { createEmptyForm } from "../form/formState";
import { useSkillOptions } from "../form/useSkillOptions";
import { createSkill, type SkillRequest } from "@/apis/skill";

const cx = classnames.bind(s);

export default function SkillCreate() {
  const router = useRouter();
  const { castTypes, projectilePaths, error: optionError } = useSkillOptions();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (body: SkillRequest) => {
    try {
      await createSkill(body);
      router.push("/skills");
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title="스킬 추가" align="left" />
      {optionError && <p className={cx("error")}>{optionError}</p>}
      <SkillForm
        initial={createEmptyForm()}
        castTypes={castTypes}
        projectilePaths={projectilePaths}
        submitText="등록"
        error={error}
        onSubmit={handleSubmit}
      />
    </>
  );
}
