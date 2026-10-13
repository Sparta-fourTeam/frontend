"use client";

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import classnames from "classnames/bind";
import s from "../links.module.scss";
import type { CardSummary } from "@/apis/card";
import { layoutCards, type LinkEdge } from "../linkModel";

const cx = classnames.bind(s);

type CardNodeData = { card: CardSummary; external: boolean; tier: number };
type CardFlowNode = Node<CardNodeData, "card">;

function CardNode({ data, selected }: NodeProps<CardFlowNode>) {
  const { card, external, tier } = data;
  return (
    <div
      className={cx("cardNode", {
        selected,
        external,
        disabled: !card.enabled,
      })}
    >
      {!external && (
        <Handle
          type="target"
          position={Position.Top}
          className={cx("handle")}
        />
      )}
      <div className={cx("cardTop")}>
        <span
          className={cx(
            "chip",
            external ? "chipExternal" : card.enabled ? "chipOn" : "chipOff",
          )}
        >
          {external ? card.skillName : card.enabled ? "사용" : "비활성"}
        </span>
        <span className={cx("cardId")}>#{card.id}</span>
      </div>
      <div className={cx("cardName")} title={card.name}>
        {card.name}
      </div>
      <div className={cx("cardMeta")}>
        <span>최대 {card.maxPickCount}회</span>
        {!external && <span>tier {tier}</span>}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={cx("handle")}
      />
      <Handle
        id="ex-out"
        type="source"
        position={Position.Right}
        isConnectable={false}
        className={cx("sideHandle")}
      />
      <Handle
        id="ex-in"
        type="target"
        position={Position.Left}
        isConnectable={false}
        className={cx("sideHandle")}
      />
    </div>
  );
}

const nodeTypes = { card: CardNode };

const EDGE_COLOR = { required: "#52525b", exclusion: "#dc2626" };

type LinkEdgeData = {
  edge: LinkEdge;
  onChangeValue: (edge: LinkEdge, value: number) => void;
};
type LinkFlowEdge = Edge<LinkEdgeData, "link">;

const labelOf = (edge: LinkEdge) =>
  edge.type === "required"
    ? `×${edge.value}`
    : edge.value > 0
      ? `배제 <${edge.value}`
      : "배제";

function LinkEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<LinkFlowEdge>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const edge = data!.edge;
  const min = edge.type === "required" ? 1 : 0;

  const commit = () => {
    setEditing(false);
    const value = Number(draft);
    if (
      draft.trim() === "" ||
      !Number.isInteger(value) ||
      value < min ||
      value === edge.value
    )
      return;
    data!.onChangeValue(edge, value);
  };

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className={cx("edgeLabel", edge.type, "nodrag", "nopan")}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          onDoubleClick={() => {
            setDraft(String(edge.value));
            setEditing(true);
          }}
          title="더블클릭해서 값 수정"
        >
          {editing ? (
            <input
              type="number"
              className={cx("edgeInput")}
              value={draft}
              min={min}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          ) : (
            labelOf(edge)
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { link: LinkEdgeView };

const toFlowEdge = (
  edge: LinkEdge,
  onChangeValue: LinkEdgeData["onChangeValue"],
): LinkFlowEdge => ({
  id: `${edge.type}-${edge.id}`,
  type: "link",
  source: String(edge.from),
  target: String(edge.to),
  sourceHandle: edge.type === "exclusion" ? "ex-out" : null,
  targetHandle: edge.type === "exclusion" ? "ex-in" : null,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: EDGE_COLOR[edge.type],
  },
  style: {
    stroke: EDGE_COLOR[edge.type],
    strokeWidth: 1.8,
    strokeDasharray: edge.type === "exclusion" ? "6 4" : undefined,
  },
  data: { edge, onChangeValue },
});

interface LinkFlowProps {
  cards: CardSummary[];
  ownIds: Set<number>;
  edges: LinkEdge[];
  layoutVersion: number;
  isValid: (from: number, to: number) => boolean;
  onConnect: (from: number, to: number) => void;
  onDelete: (edges: LinkEdge[]) => void;
  onChangeValue: (edge: LinkEdge, value: number) => void;
  onSelect: (cardId: number | null) => void;
}

export default function LinkFlow({
  cards,
  ownIds,
  edges,
  layoutVersion,
  isValid,
  onConnect,
  onDelete,
  onChangeValue,
  onSelect,
}: LinkFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CardFlowNode>([]);
  const { fitView } = useReactFlow();

  const appliedVersion = useRef(-1);

  useEffect(() => {
    const { tier, position } = layoutCards(cards, edges);
    const relayout = appliedVersion.current !== layoutVersion;
    appliedVersion.current = layoutVersion;
    setNodes((prev) =>
      cards.map((card) => {
        const old = prev.find((n) => n.id === String(card.id));
        return {
          id: String(card.id),
          type: "card",
          position:
            old && !relayout
              ? old.position
              : (position.get(card.id) ?? { x: 0, y: 0 }),
          selected: old?.selected,
          deletable: false,
          data: {
            card,
            external: !ownIds.has(card.id),
            tier: tier.get(card.id) ?? 0,
          },
        };
      }),
    );
  }, [cards, edges, ownIds, layoutVersion, setNodes]);

  useEffect(() => {
    const timer = setTimeout(
      () => fitView({ padding: 0.15, duration: 200 }),
      50,
    );
    return () => clearTimeout(timer);
  }, [layoutVersion, fitView]);

  const flowEdges = useMemo(
    () => edges.map((edge) => toFlowEdge(edge, onChangeValue)),
    [edges, onChangeValue],
  );

  return (
    <ReactFlow<CardFlowNode, LinkFlowEdge>
      nodes={nodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      isValidConnection={(c) => isValid(Number(c.source), Number(c.target))}
      onConnect={(c: Connection) =>
        onConnect(Number(c.source), Number(c.target))
      }
      onEdgesDelete={(deleted) => onDelete(deleted.map((e) => e.data!.edge))}
      onNodeClick={(_, node) => onSelect(Number(node.id))}
      onPaneClick={() => onSelect(null)}
      deleteKeyCode={["Backspace", "Delete"]}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.3}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={18} size={1.2} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
