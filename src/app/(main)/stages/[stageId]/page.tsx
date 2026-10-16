import StageDetail from "@/modules/stage/detail";

export default async function StageDetailPage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const { stageId } = await params;
  return <StageDetail stageId={Number(stageId)} />;
}
