"use client";

import NameLabelManager from "@/components/common/NameLabelManager";
import { effectKindApi } from "@/apis/effectKind";

export default function EffectKindList() {
  return (
    <NameLabelManager
      title="효과 종류 관리"
      subtitle="카드 효과의 kind(EffectRegistry key)를 등록·수정합니다. 이름은 유니티에 그대로 내려갑니다."
      itemName="효과 종류"
      api={effectKindApi}
      namePlaceholder="이름 (예: damage)"
      labelPlaceholder="표시 이름 (예: 공격력 증가)"
    />
  );
}
