"use client";

import NameLabelManager from "@/components/common/NameLabelManager";
import { skillFormApi } from "@/apis/skillForm";

export default function SkillFormList() {
  return (
    <NameLabelManager
      title="효과 관리"
      subtitle="카드 효과에서 사용하는 스킬 형태를 등록·수정·삭제합니다. 이름은 유니티에 그대로 내려갑니다."
      itemName="효과"
      api={skillFormApi}
      namePlaceholder="이름 (예: Fire)"
      labelPlaceholder="표시 이름 (예: 화염 형태)"
    />
  );
}
