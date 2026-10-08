"use client";

import NameLabelManager from "@/components/common/NameLabelManager";
import { skillCastTypeApi } from "@/apis/skillCastType";

export default function CastTypeList() {
  return (
    <NameLabelManager
      title="시전 방식 관리"
      subtitle="스킬의 시전 방식을 등록·수정·삭제합니다. 이름은 유니티에 그대로 내려갑니다."
      itemName="시전 방식"
      api={skillCastTypeApi}
      namePlaceholder="이름 (예: INSTANT)"
      labelPlaceholder="표시 이름 (예: 즉시 시전)"
    />
  );
}
