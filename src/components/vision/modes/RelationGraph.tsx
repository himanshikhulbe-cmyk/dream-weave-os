import { useEffect, useMemo, useRef, useState } from "react";
import type { Connection, Section, VisionItem } from "@/lib/vision/types";
import { isGoal } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

export interface RelationGraphProps {
  items: VisionItem[];
  connections: Connection[];
  sections: Section[];
  onOpen?: ((item: VisionItem) => void) | undefined;
  className?: string | undefined;
}

type NodeKind = "item" | "section";

interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  item?: VisionItem;
  sectionId?: string;
}

interface GraphEdge {
  a: string;
  b: string;
  kind: "implicit" | "explicit";
  label?: string | null;
}

const W = 1000;
const H = 700;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function RelationGraph({ items, connections, sections, onOpen, className }: RelationGraphProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const [, forceTick] = useState(0);
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const panRef = useRef<{ dragging: boolean; startX: number; startY: number; camX: number; camY: number }>({
    dragging: false,
    startX: 0,
    startY: 0,
    camX: 0,
    camY: 0,
  });
  const dragNodeRef = useRef<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; type: string } | null>(null);

  const sectionById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  const built = useMemo(() => {
    const nodes: GraphNode[] = [];
    sections.forEach((s, i) => {
      const h = hash(s.id);
      nodes.push({
        id: `section:${s.id}`,
        kind: "section",
        label: s.name,
        color: s.color ?? "var(--lavender)",
        radius: 24,
        x: W / 2 + Math.cos((i / Math.max(sections.length, 1)) * Math.PI * 2) * 180,
        y: H / 2 + Math.sin((i / Math.max(sections.length, 1)) * Math.PI * 2) * 180,
        vx: 0,
        vy: 0,
        sectionId: s.id,
      });
    });
    items.forEach((it) => {
      const h = hash(it.id);
      const sec = it.section_id ? sectionById.get(it.section_id) : undefined;
      let importance = 8;
      if (isGoal(it)) importance += 4;
      if (it.pinned) importance += 3;
      importance += (it.priority ?? 0) * 1.2;
      nodes.push({
        id: it.id,
        kind: "item",
        label: it.title ?? it.type,
        color: sec?.color ?? "var(--lavender)",
        radius: Math.min(20, importance),
        x: W / 2 + (((h % 400) - 200)),
        y: H / 2 + ((((h >> 8) % 400) - 200)),
        vx: 0,
        vy: 0,
        item: it,
        sectionId: it.section_id ?? undefined,
      });
    });

    const edges: GraphEdge[] = [];
    for (const it of items) {
      if (it.section_id) edges.push({ a: it.id, b: `section:${it.section_id}`, kind: "implicit" });
    }
    for (const c of connections) {
      edges.push({ a: c.from_item_id, b: c.to_item_id, kind: "explicit", label: c.label });
    }
    return { nodes, edges };
  }, [items, connections, sections, sectionById]);

  useEffect(() => {
    nodesRef.current = built.nodes.map((n) => {
      const existing = nodesRef.current.find((p) => p.id === n.id);
      return existing ? { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy } : n;
    });
    edgesRef.current = built.edges;
  }, [built]);

  useEffect(() => {
    let ticks = 0;
    let stopped = false;
    function step() {
      if (stopped) return;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const byId = new Map(nodes.map((n) => [n.id, n]));
      if (ticks < 300) {
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i];
          if (!a || a.id === dragNodeRef.current) continue;
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            if (!b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1800 / (dist * dist);
            a.vx -= (dx / dist) * force;
            a.vy -= (dy / dist) * force;
            if (b.id !== dragNodeRef.current) {
              b.vx += (dx / dist) * force;
              b.vy += (dy / dist) * force;
            }
          }
          const cx = W / 2;
          const cy = H / 2;
          a.vx += (cx - a.x) * 0.0015;
          a.vy += (cy - a.y) * 0.0015;
        }
        for (const e of edges) {
          const a = byId.get(e.a);
          const b = byId.get(e.b);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = e.kind === "implicit" ? 140 : 200;
          const force = (dist - target) * 0.02;
          if (a.id !== dragNodeRef.current) {
            a.vx += (dx / dist) * force;
            a.vy += (dy / dist) * force;
          }
          if (b.id !== dragNodeRef.current) {
            b.vx -= (dx / dist) * force;
            b.vy -= (dy / dist) * force;
          }
        }
        for (const n of nodes) {
          if (n.id === dragNodeRef.current) continue;
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;
        }
        ticks++;
      }
      forceTick((t) => (t + 1) % 100000);
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [built]);

  function screenToWorld(clientX: number, clientY: number) {
    const svg = containerRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    return { x: (x - transform.x) / transform.zoom, y: (y - transform.y) / transform.zoom };
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setTransform((t) => ({ ...t, zoom: Math.min(2.5, Math.max(0.4, t.zoom - e.deltaY * 0.001)) }));
  }

  function onNodePointerDown(id: string, e: React.PointerEvent) {
    e.stopPropagation();
    dragNodeRef.current = id;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onSvgPointerMove(e: React.PointerEvent) {
    if (dragNodeRef.current) {
      const w = screenToWorld(e.clientX, e.clientY);
      const n = nodesRef.current.find((x) => x.id === dragNodeRef.current);
      if (n) {
        n.x = w.x;
        n.y = w.y;
        n.vx = 0;
        n.vy = 0;
      }
      return;
    }
    const p = panRef.current;
    if (p.dragging) {
      setTransform((t) => ({ ...t, x: p.camX + (e.clientX - p.startX), y: p.camY + (e.clientY - p.startY) }));
    }
  }

  function onSvgPointerUp() {
    dragNodeRef.current = null;
    panRef.current.dragging = false;
  }

  function onSvgPointerDown(e: React.PointerEvent) {
    panRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, camX: transform.x, camY: transform.y };
  }

  const neighbors = useMemo(() => {
    if (!hoverId) return new Set<string>();
    const set = new Set<string>([hoverId]);
    for (const e of edgesRef.current) {
      if (e.a === hoverId) set.add(e.b);
      if (e.b === hoverId) set.add(e.a);
    }
    return set;
  }, [hoverId]);

  if (items.length === 0 && connections.length === 0) {
    return (
      <div className={cn("flex h-full min-h-[420px] w-full items-center justify-center rounded-3xl aurora-bg", className)}>
        <p className="max-w-sm px-6 text-center font-display text-xl italic text-muted-foreground">
          Connect two dreams from any board to grow your graph.
        </p>
      </div>
    );
  }

  const nodes = nodesRef.current;
  const edges = edgesRef.current;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <div className={cn("relative h-full min-h-[420px] w-full overflow-hidden rounded-3xl aurora-bg", className)}>
      <svg
        ref={containerRef}
        className="h-full w-full touch-none select-none"
        viewBox={`0 0 ${W} ${H}`}
        onWheel={onWheel}
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onPointerLeave={onSvgPointerUp}
      >
        <defs>
          <linearGradient id="graph-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--rose)" />
            <stop offset="100%" stopColor="var(--lavender)" />
          </linearGradient>
        </defs>
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.zoom})`}>
          {edges.map((e, i) => {
            const a = byId.get(e.a);
            const b = byId.get(e.b);
            if (!a || !b) return null;
            const dim = hoverId && !(neighbors.has(e.a) && neighbors.has(e.b));
            return (
              <g key={`${e.a}-${e.b}-${i}`} opacity={dim ? 0.15 : 1}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={e.kind === "explicit" ? "url(#graph-edge)" : "currentColor"}
                  className={e.kind === "implicit" ? "text-muted-foreground" : undefined}
                  strokeWidth={e.kind === "explicit" ? 1.6 : 1}
                  strokeDasharray={e.kind === "implicit" ? "4 6" : undefined}
                  opacity={e.kind === "implicit" ? 0.35 : 0.8}
                />
                {e.kind === "explicit" && e.label && (
                  <text
                    x={(a.x + b.x) / 2}
                    y={(a.y + b.y) / 2}
                    fontSize={9}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-muted-foreground"
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((n) => {
            const dim = hoverId && !neighbors.has(n.id);
            const isHover = hoverId === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                opacity={dim ? 0.25 : 1}
                className="cursor-pointer"
                onPointerDown={(e) => onNodePointerDown(n.id, e)}
                onPointerEnter={() => {
                  setHoverId(n.id);
                  setTooltip({ x: n.x, y: n.y, title: n.label, type: n.kind === "section" ? "Section" : n.item?.type ?? "" });
                }}
                onPointerLeave={() => {
                  setHoverId((cur) => (cur === n.id ? null : cur));
                  setTooltip(null);
                }}
                onClick={() => n.item && onOpen?.(n.item)}
              >
                <circle
                  r={n.radius}
                  fill={n.color}
                  fillOpacity={n.kind === "section" ? 0.25 : 0.7}
                  stroke={n.kind === "section" ? "var(--chrome)" : n.color}
                  strokeWidth={n.kind === "section" ? 2 : 1}
                  className={isHover ? "drop-shadow-[0_0_10px_var(--rose)]" : undefined}
                />
                {n.kind === "section" && (
                  <text y={n.radius + 14} textAnchor="middle" fontSize={11} fill="currentColor" className="text-foreground">
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl glass-strong px-3 py-1.5 text-xs"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
          }}
        >
          <p className="truncate font-display italic text-foreground">{tooltip.title}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{tooltip.type}</p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 rounded-2xl glass px-3 py-2 text-xs shadow-glass">
        {sections.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? "var(--lavender)" }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
