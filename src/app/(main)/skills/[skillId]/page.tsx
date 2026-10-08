import SkillDetail from "@/modules/skill/detail";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  return <SkillDetail skillId={skillId} />;
}
