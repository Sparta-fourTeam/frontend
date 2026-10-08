"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import classnames from "classnames/bind";
import s from "../list/skillList.module.scss";
import Title from "@/components/common/Title";
import SkillForm from "../form";
import { detailToForm } from "../form/formState";
import { useSkillOptions } from "../form/useSkillOptions";
import {
  deleteSkill,
  getSkill,
  updateSkill,
  type SkillDetail as SkillDetailData,
  type SkillRequest,
} from "@/apis/skill";

const cx = classnames.bind(s);

interface SkillDetailProps {
  skillId: string;
}

export default function SkillDetail({ skillId }: SkillDetailProps) {
  const router = useRouter();
  const { castTypes, projectilePaths, error: optionError } = useSkillOptions();
  const [skill, setSkill] = useState<SkillDetailData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getSkill(skillId)
      .then((data) => {
        if (!ignore) setSkill(data);
      })
      .catch((e) => {
        if (!ignore) setLoadError(e instanceof Error ? e.message : "스킬을 불러오지 못했습니다.");
      });
    return () => {
      ignore = true;
    };
  }, [skillId]);

  const handleSubmit = async (body: SkillRequest) => {
    try {
      await updateSkill(skillId, body);
      router.push("/skills");
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!skill || !confirm(`'${skill.name}' 스킬을 삭제할까요?`)) return;
    try {
      await deleteSkill(skillId);
      router.push("/skills");
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <>
      <Title title={skill ? skill.name : "스킬 상세"} align="left" />
      {(loadError || optionError) && (
        <p className={cx("error")}>{loadError ?? optionError}</p>
      )}

      {skill ? (
        <SkillForm
          initial={detailToForm(skill)}
          castTypes={castTypes}
          projectilePaths={projectilePaths}
          submitText="저장"
          error={error}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      ) : (
        !loadError && <p className={cx("empty")}>불러오는 중...</p>
      )}
    </>
  );
}
