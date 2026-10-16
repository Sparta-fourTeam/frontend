import ItemDetail from "@/modules/item/detail";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  return <ItemDetail itemId={decodeURIComponent(itemId)} />;
}
