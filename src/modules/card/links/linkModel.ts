import type { CardDetail, CardSummary } from "@/apis/card";

export type LinkType = "required" | "exclusion";

export interface LinkEdge {
  id: number;
  type: LinkType;
  from: number;
  to: number;
  value: number;
}

const CARD_GAP_X = 230;
const CARD_GAP_Y = 190;

export const toEdges = (details: CardDetail[]): LinkEdge[] =>
  details.flatMap((card) => [
    ...card.requiredCardCounts.map<LinkEdge>((r) => ({
      id: r.id,
      type: "required",
      from: r.requiredCard.id,
      to: card.id,
      value: r.count,
    })),
    ...card.exclusions.map<LinkEdge>((e) => ({
      id: e.id,
      type: "exclusion",
      from: e.excludingCard.id,
      to: card.id,
      value: e.belowPermanentLevel,
    })),
  ]);

export const graphCards = (
  skillCards: CardSummary[],
  allCards: CardSummary[],
  edges: LinkEdge[],
) => {
  const own = new Set(skillCards.map((c) => c.id));
  const external = allCards.filter(
    (c) =>
      !own.has(c.id) && edges.some((e) => e.from === c.id || e.to === c.id),
  );
  return [...skillCards, ...external];
};

export const computeTiers = (cards: CardSummary[], edges: LinkEdge[]) => {
  const tier = new Map<number, number>();
  const visit = (id: number, stack: Set<number>): number => {
    if (tier.has(id)) return tier.get(id)!;
    if (stack.has(id)) return 0;
    stack.add(id);
    const parents = edges
      .filter((e) => e.type === "required" && e.to === id)
      .map((e) => e.from);
    const t =
      parents.length === 0
        ? 0
        : Math.max(...parents.map((p) => visit(p, stack))) + 1;
    stack.delete(id);
    tier.set(id, t);
    return t;
  };
  cards.forEach((c) => visit(c.id, new Set()));
  return tier;
};

export const layoutCards = (cards: CardSummary[], edges: LinkEdge[]) => {
  const tier = computeTiers(cards, edges);
  const rows = new Map<number, number[]>();
  cards.forEach((c) => {
    const t = tier.get(c.id) ?? 0;
    rows.set(t, [...(rows.get(t) ?? []), c.id]);
  });
  const position = new Map<number, { x: number; y: number }>();
  for (const [t, ids] of rows) {
    ids.forEach((id, i) =>
      position.set(id, {
        x: (i - (ids.length - 1) / 2) * CARD_GAP_X,
        y: t * CARD_GAP_Y,
      }),
    );
  }
  return { tier, position };
};

export const createsCycle = (edges: LinkEdge[], from: number, to: number) => {
  if (from === to) return true;
  const stack = [from];
  const seen = new Set<number>();
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === to) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    edges
      .filter((e) => e.type === "required" && e.to === current)
      .forEach((e) => stack.push(e.from));
  }
  return false;
};
