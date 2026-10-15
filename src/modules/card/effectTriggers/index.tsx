"use client";

import NameLabelManager from "@/components/common/NameLabelManager";
import { effectTriggerApi } from "@/apis/effectTrigger";

export default function EffectTriggerList() {
  return (
    <NameLabelManager
      title="효과 발동 시점 관리"
      subtitle="onEvent 효과가 발동하는 시점을 등록·수정·삭제합니다. 이름은 유니티에 그대로 내려갑니다."
      itemName="발동 시점"
      api={effectTriggerApi}
      namePlaceholder="이름 (예: OnHit)"
      labelPlaceholder="표시 이름 (예: 적중 시)"
    />
  );
}
