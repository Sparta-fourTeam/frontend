"use client";

import NameLabelManager from "@/components/common/NameLabelManager";
import { skillElementApi } from "@/apis/skillElement";

export default function ElementList() {
  return (
    <NameLabelManager
      title="속성 관리"
      subtitle="스킬·몬스터 속성을 등록·수정·삭제합니다. 이름은 유니티에 그대로 내려갑니다."
      itemName="속성"
      api={skillElementApi}
      namePlaceholder="이름 (예: FIRE)"
      labelPlaceholder="표시 이름 (예: 화염)"
    />
  );
}
