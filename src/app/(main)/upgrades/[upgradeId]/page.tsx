import UpgradeDetail from "@/modules/upgrade/detail";

export default async function UpgradeDetailPage({
  params,
}: {
  params: Promise<{ upgradeId: string }>;
}) {
  const { upgradeId } = await params;
  return <UpgradeDetail upgradeId={decodeURIComponent(upgradeId)} />;
}
