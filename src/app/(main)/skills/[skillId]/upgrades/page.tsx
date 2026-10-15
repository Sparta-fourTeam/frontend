import SkillUpgradeLinks from "@/modules/card/links/skillUpgradeLinks";

export default async function SkillUpgradesPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  return <SkillUpgradeLinks skillId={Number(skillId)} />;
}
