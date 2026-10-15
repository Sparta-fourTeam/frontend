"use client";

import NameLabelManager from "@/components/common/NameLabelManager";
import { skillProjectilePathApi } from "@/apis/skillProjectilePath";

export default function ProjectilePathList() {
  return (
    <NameLabelManager
      title="투사체 경로 관리"
      subtitle="스킬 투사체의 이동 경로를 등록·수정·삭제합니다. 이름은 유니티에 그대로 내려갑니다."
      itemName="투사체 경로"
      api={skillProjectilePathApi}
      namePlaceholder="이름 (예: STRAIGHT)"
      labelPlaceholder="표시 이름 (예: 직선)"
    />
  );
}
