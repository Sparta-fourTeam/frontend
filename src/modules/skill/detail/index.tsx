import Title from "@/components/common/Title";

interface SkillDetailProps {
  skillId: string;
}

export default function SkillDetail({ skillId }: SkillDetailProps) {
  // TODO: skillId 로 스킬 상세 API 호출
  return (
    <Title
      title={`스킬 상세 #${skillId}`}
      subtitle="스킬 관련 정보가 들어갈 자리"
      align="left"
    />
  );
}
