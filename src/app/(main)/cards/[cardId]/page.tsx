import CardDetail from "@/modules/card/detail";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  return <CardDetail cardId={Number(cardId)} />;
}
