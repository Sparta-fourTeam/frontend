"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import classnames from "classnames/bind";
import s from "./links.module.scss";
import Button from "@/components/common/Button";
import LinkFlow from "./components/linkFlow";
import LinkPanel from "./components/linkPanel";
import {
  createsCycle,
  graphCards,
  toEdges,
  type LinkEdge,
  type LinkType,
} from "./linkModel";
import {
  createExclusion,
  createRequiredCardCount,
  deleteExclusion,
  deleteRequiredCardCount,
  getCard,
  type CardSummary,
} from "@/apis/card";

const cx = classnames.bind(s);

const MODE_LABEL: Record<LinkType, string> = {
  required: "선행 연결",
  exclusion: "배제 연결",
};

interface CardLinkManagerProps {
  skillId: number;
  cards: CardSummary[];
}

export default function CardLinkManager({
  skillId,
  cards,
}: CardLinkManagerProps) {
  const skillCards = useMemo(
    () => cards.filter((c) => c.skillId === skillId),
    [cards, skillId],
  );
  const ownIds = useMemo(
    () => new Set(skillCards.map((c) => c.id)),
    [skillCards],
  );
  const [edges, setEdges] = useState<LinkEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<LinkType>("required");
  const [layoutVersion, setLayoutVersion] = useState(0);

  const load = useCallback(
    () => Promise.all(skillCards.map((c) => getCard(c.id))).then(toEdges),
    [skillCards],
  );

  useEffect(() => {
    let ignore = false;
    load()
      .then((data) => {
        if (!ignore) setEdges(data);
      })
      .catch((e) => {
        if (!ignore)
          setMessage({
            text:
              e instanceof Error
                ? e.message
                : "연결 정보를 불러오지 못했습니다.",
            error: true,
          });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [load]);

  const nodesCards = useMemo(
    () => graphCards(skillCards, cards, edges),
    [skillCards, cards, edges],
  );

  const run = async (action: () => Promise<unknown>, done: string) => {
    try {
      await action();
      setEdges(await load());
      setMessage({ text: done, error: false });
      return null;
    } catch (e) {
      const text = e instanceof Error ? e.message : "요청에 실패했습니다.";
      setMessage({ text, error: true });
      setEdges(await load().catch(() => edges));
      return text;
    }
  };

  const otherSkillOf = (cardId: number) => {
    const skill = cards.find((c) => c.id === cardId)?.skillId;
    return skill !== skillId ? skill : undefined;
  };

  const nameOf = (id: number) =>
    cards.find((c) => c.id === id)?.name ?? `#${id}`;

  const add = (type: LinkType, from: number, to: number, value?: number) => {
    const otherSkill = otherSkillOf(from);
    return run(
      () =>
        type === "required"
          ? createRequiredCardCount(to, {
              requiredCardId: from,
              skillId: otherSkill,
              count: value,
            })
          : createExclusion(to, {
              excludingCardId: from,
              skillId: otherSkill,
              belowPermanentLevel: value,
            }),
      `${nameOf(from)} → ${nameOf(to)} ${type === "required" ? "선행" : "배제"} 연결을 추가했습니다.`,
    );
  };

  const remove = (targets: LinkEdge[]) =>
    run(
      () =>
        Promise.all(
          targets.map((e) =>
            e.type === "required"
              ? deleteRequiredCardCount(e.id)
              : deleteExclusion(e.id),
          ),
        ),
      `연결 ${targets.length}개를 삭제했습니다.`,
    );

  const changeValue = (edge: LinkEdge, value: number) =>
    run(
      async () => {
        if (edge.type === "required") {
          await deleteRequiredCardCount(edge.id);
          await createRequiredCardCount(edge.to, {
            requiredCardId: edge.from,
            skillId: otherSkillOf(edge.from),
            count: value,
          });
        } else {
          await deleteExclusion(edge.id);
          await createExclusion(edge.to, {
            excludingCardId: edge.from,
            skillId: otherSkillOf(edge.from),
            belowPermanentLevel: value,
          });
        }
      },
      `${nameOf(edge.from)} → ${nameOf(edge.to)} 값을 ${value}(으)로 바꿨습니다.`,
    );

  const isValid = (from: number, to: number) =>
    ownIds.has(to) &&
    from !== to &&
    !edges.some((e) => e.type === mode && e.from === from && e.to === to) &&
    (mode === "exclusion" || !createsCycle(edges, from, to));

  const selected = skillCards.find((c) => c.id === selectedId);

  if (skillCards.length === 0)
    return <p className={cx("empty")}>이 스킬에 등록된 카드가 없습니다.</p>;

  return (
    <>
      <div className={cx("toolbar")}>
        <div className={cx("segment")} role="group" aria-label="연결 종류">
          {(Object.keys(MODE_LABEL) as LinkType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={cx("segmentItem", type, { active: mode === type })}
              onClick={() => setMode(type)}
            >
              {MODE_LABEL[type]}
            </button>
          ))}
        </div>
        <Button
          size="small"
          variant="outline"
          onClick={() => setLayoutVersion((v) => v + 1)}
        >
          자동 정렬
        </Button>
        {message && (
          <span
            className={cx("status", { statusError: message.error })}
            role="status"
          >
            {message.text}
          </span>
        )}
      </div>
      <ul className={cx("help")}>
        <li>카드 아래 점을 끌어 다른 카드 위 점에 놓으면 연결</li>
        <li>화살표 클릭 후 Delete로 삭제</li>
        <li>숫자 더블클릭으로 값 수정</li>
        <li>카드는 드래그로 이동</li>
        <li className={cx("legendItem", "required")}>선행 (×필요 횟수)</li>
        <li className={cx("legendItem", "exclusion")}>배제 (&lt;영구 레벨)</li>
      </ul>
      <div className={cx("layout")}>
        <div className={cx("canvas")}>
          {loading ? (
            <p className={cx("loading")}>불러오는 중...</p>
          ) : (
            <ReactFlowProvider>
              <LinkFlow
                cards={nodesCards}
                ownIds={ownIds}
                edges={edges}
                layoutVersion={layoutVersion}
                isValid={isValid}
                onConnect={(from, to) => add(mode, from, to)}
                onDelete={remove}
                onChangeValue={changeValue}
                onSelect={(id) =>
                  setSelectedId(id !== null && ownIds.has(id) ? id : null)
                }
              />
            </ReactFlowProvider>
          )}
        </div>
        {selected ? (
          <LinkPanel
            card={selected}
            cards={cards}
            edges={edges}
            onAdd={(type, from, value) => add(type, from, selected.id, value)}
            onRemove={(edge) => remove([edge])}
            onChangeValue={changeValue}
          />
        ) : (
          <aside className={cx("panel", "placeholder")}>
            카드를 클릭하면 연결 목록을 편집할 수 있습니다.
          </aside>
        )}
      </div>
    </>
  );
}
