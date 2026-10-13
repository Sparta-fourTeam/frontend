import {
  createCard,
  createCardEffect,
  createVariant,
  createVariantEffect,
  deleteCardEffect,
  deleteVariant,
  updateCard,
  updateCardEffect,
  updateVariant,
  type CardDetail,
  type CardEffect,
  type CardEffectRequest,
} from "@/apis/card";
import { draftToRequest, type EffectDraft } from "./effectDraft";
import type { CardFormValue } from "./cardFormState";

export class CardSaveError extends Error {
  constructor(
    message: string,
    public cardId?: number,
  ) {
    super(message);
  }
}

const syncEffects = async (
  before: CardEffect[],
  drafts: EffectDraft[],
  create: (body: CardEffectRequest) => Promise<unknown>,
) => {
  const keep = new Set(
    drafts.map((d) => d.id).filter((id) => id !== undefined),
  );
  for (const effect of before) {
    if (!keep.has(effect.id)) await deleteCardEffect(effect.id);
  }
  for (const [index, draft] of drafts.entries()) {
    const body = draftToRequest(draft, index);
    if (draft.id !== undefined) await updateCardEffect(draft.id, body);
    else await create(body);
  }
};

export async function saveCard(
  value: CardFormValue,
  original?: CardDetail,
): Promise<number> {
  const saved = original
    ? await updateCard(original.id, value.request)
    : await createCard(value.request);
  const cardId = saved.id;

  try {
    await syncEffects(original?.effects ?? [], value.effects, (body) =>
      createCardEffect(cardId, body),
    );

    const beforeVariants = original?.variants ?? [];
    const keep = new Set(
      value.variants.map((v) => v.id).filter((id) => id !== undefined),
    );
    for (const variant of beforeVariants) {
      if (!keep.has(variant.id)) await deleteVariant(variant.id);
    }
    for (const draft of value.variants) {
      const body = {
        minPermanentLevel: Number(draft.minPermanentLevel),
        name: draft.name.trim(),
        desc: draft.desc.trim() === "" ? undefined : draft.desc.trim(),
      };
      const variantId =
        draft.id !== undefined
          ? (await updateVariant(draft.id, body)).id
          : (await createVariant(cardId, body)).id;
      const before =
        beforeVariants.find((v) => v.id === draft.id)?.effects ?? [];
      await syncEffects(before, draft.effects, (b) =>
        createVariantEffect(variantId, b),
      );
    }
  } catch (e) {
    throw new CardSaveError(
      `카드는 저장됐지만 효과·변형 저장 중 실패했습니다: ${e instanceof Error ? e.message : ""}`,
      cardId,
    );
  }
  return cardId;
}
