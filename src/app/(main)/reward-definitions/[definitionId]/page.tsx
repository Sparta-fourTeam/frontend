import RewardDefinitionDetail from "@/modules/rewardDefinition/detail";

export default async function RewardDefinitionDetailPage({
  params,
}: {
  params: Promise<{ definitionId: string }>;
}) {
  const { definitionId } = await params;
  return <RewardDefinitionDetail definitionId={Number(definitionId)} />;
}
