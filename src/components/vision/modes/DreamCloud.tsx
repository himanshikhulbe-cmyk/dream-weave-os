import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaUrl } from "@/components/vision/cards/MediaImage";
import type { Connection, VisionItem } from "@/lib/vision/types";
import { isGoal } from "@/lib/vision/types";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Mic, FileText, Play, File, Minus, Plus, LocateFixed } from "lucide-react";

export interface DreamCloudProps {
  items: VisionItem[];
  connections?: Connection[];
  onOpen?: (item: VisionItem) => void;
  /** Optional override for resolving an image URL (used by the public demo). */
  resolveImage?: (item: VisionItem) => string | null;
  className?: string;
  /** Bump to force a fresh random layout (e.g. after Vision Shuffle). */
  seed?: number;
}

/* ------------------------------------------------------------------ */
/* Deterministic helpers                                               */
/* ------------------------------------------------------------------ */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function importance(item: VisionItem): number {
  let score = 1;
  if (isGoal(item)) score += 0.55;
  if (item.pinned) score += 0.5;
  score += (item.priority ?? 0) * 0.18;
  return Math.min(score, 2.4);
}

interface PhysicsNode {
  id: string;
  item: VisionItem;
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  depth: number;
  size: number;
  el: HTMLDivElement | null;
}

const WORLD_W = 1600;
const WORLD_H = 1000;

function makeNodes(items: VisionItem[], seed: number): PhysicsNode[] {
  return items.map((item, i) => {
    const h = hashString(item.id + ":" + String(seed));
    const hx = ((h % 10000) / 10000) * WORLD_W;
    const hy = (((h >> 10) % 10000) / 10000) * WORLD_H;
    const depth = 0.6 + ((h >> 20) % 100) / 100 / 1.66; // 0.6 - 1.2
    const size = 46 + importance(item) * 26;
    return {
      id: item.id,
      item,
      x: hx,
      y: hy,
      vx: 0,
      vy: 0,
      homeX: hx,
      homeY: hy,
      depth,
      size,
      el: null,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Node glyph / content                                                */
/* ------------------------------------------------------------------ */

function NodeImage({ item, resolveImage }: { item: VisionItem; resolveImage?: (item: VisionItem) => string | null }) {
  const override = resolveImage?.(item) ?? null;
  const signed = useMediaUrl(override ? null : item.media_path);
  const url = override ?? signed;
  if (!url) {
    return (
      <div className="grid h-full w-full place-items-center rounded-full bg-glass-strong">
        <ImageIcon className="h-1/3 w-1/3 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={item.title ?? "Dream"}
      className="h-full w-full rounded-full object-cover"
      draggable={false}
    />
  );
}

function NodeContent({ item, resolveImage }: { item: VisionItem; resolveImage?: (item: VisionItem) => string | null }) {
  switch (item.type) {
    case "image":
      return <NodeImage item={item} resolveImage={resolveImage} />;
    case "video":
      return (
        <div className="grid h-full w-full place-items-center rounded-full bg-charcoal/70">
          <Play className="h-1/3 w-1/3 text-pearl" strokeWidth={1.5} fill="currentColor" />
        </div>
      );
    case "audio":
      return (
        <div className="relative grid h-full w-full place-items-center rounded-full bg-midnight/60">
          <span className="absolute inset-1 rounded-full border border-chrome/40 animate-pulse-glow" />
          <Mic className="h-1/3 w-1/3 text-chrome" strokeWidth={1.5} />
        </div>
      );
    case "document":
      return (
        <div className="grid h-full w-full place-items-center rounded-full bg-glass-strong">
          <File className="h-1/3 w-1/3 text-muted-foreground" strokeWidth={1.5} />
        </div>
      );
    default:
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-glass-strong p-3 text-center">
          <p className="font-display text-[0.7em] italic leading-tight text-foreground line-clamp-3">
            {item.title ?? "Untitled"}
          </p>
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function DreamCloud({ items, connections = [], onOpen, resolveImage, className, seed = 0 }: DreamCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 0.85 });
  const hoverRef = useRef<string | null>(null);
  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; camX: number; camY: number; moved: boolean }>({
    dragging: false,
    startX: 0,
    startY: 0,
    camX: 0,
    camY: 0,
    moved: false,
  });
  const rafRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [zoomTick, setZoomTick] = useState(0.85);
  const [reducedMotion, setReducedMotion] = useState(false);

  const nodes = useMemo(() => makeNodes(items, seed), [items, seed]);

  useEffect(() => {
    nodesRef.current = nodes.map((n) => {
      const existing = nodesRef.current.find((p) => p.id === n.id);
      return existing ? { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy, el: null } : n;
    });
  }, [nodes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  useEffect(() => {
    let stopped = false;

    function step() {
      if (stopped) return;
      const list = nodesRef.current;
      timeRef.current += 1;
      const t = timeRef.current;

      if (!reducedMotion) {
        for (let i = 0; i < list.length; i++) {
          const n = list[i];
          if (!n) continue;
          // gentle drift
          const driftX = Math.sin(t * 0.006 + hashString(n.id) % 100) * 0.05;
          const driftY = Math.cos(t * 0.0055 + hashString(n.id) % 77) * 0.05;
          // spring to home
          const springX = (n.homeX - n.x) * 0.0025;
          const springY = (n.homeY - n.y) * 0.0025;
          n.vx = (n.vx + driftX + springX) * 0.94;
          n.vy = (n.vy + driftY + springY) * 0.94;
        }
        // repulsion
        for (let i = 0; i < list.length; i++) {
          const a = list[i];
          if (!a) continue;
          for (let j = i + 1; j < list.length; j++) {
            const b = list[j];
            if (!b) continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (a.size + b.size) / 2 + 18;
            if (dist < minDist) {
              const force = ((minDist - dist) / dist) * 0.02;
              a.vx -= dx * force;
              a.vy -= dy * force;
              b.vx += dx * force;
              b.vy += dy * force;
            }
          }
        }
        // weak attraction between connected nodes
        for (const c of connections) {
          const a = byId.get(c.from_item_id);
          const b = byId.get(c.to_item_id);
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist > 260) {
            const force = 0.0006 * (dist - 260);
            a.vx += (dx / dist) * force;
            a.vy += (dy / dist) * force;
            b.vx -= (dx / dist) * force;
            b.vy -= (dy / dist) * force;
          }
        }
        for (const n of list) {
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // paint
      const cam = cameraRef.current;
      for (const n of list) {
        if (!n.el) continue;
        const isHover = hoverRef.current === n.id;
        const scale = (isHover ? 1.12 : 1) * cam.zoom;
        const blur = n.depth < 0.85 ? (0.85 - n.depth) * 10 : 0;
        const px = n.x + cam.x * n.depth;
        const py = n.y + cam.y * n.depth;
        n.el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${scale})`;
        n.el.style.filter = blur ? `blur(${blur}px)` : "";
        n.el.style.zIndex = isHover ? "50" : String(Math.round(n.depth * 10));
        n.el.style.opacity = String(0.55 + n.depth * 0.4);
      }
      if (svgRef.current) {
        svgRef.current.style.transform = `translate3d(${cam.x}px, ${cam.y}px, 0) scale(${cam.zoom})`;
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [byId, connections, reducedMotion]);

  function recenter() {
    cameraRef.current = { x: 0, y: 0, zoom: 0.85 };
    setZoomTick(0.85);
  }

  function zoomBy(delta: number) {
    cameraRef.current = {
      ...cameraRef.current,
      zoom: Math.min(2, Math.max(0.5, cameraRef.current.zoom + delta)),
    };
    setZoomTick(cameraRef.current.zoom);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(-e.deltaY * 0.0012);
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      camX: cameraRef.current.x,
      camY: cameraRef.current.y,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    cameraRef.current = { ...cameraRef.current, x: d.camX + dx, y: d.camY + dy };
  }

  function onPointerUp() {
    dragRef.current.dragging = false;
  }

  const hoveredItem = hoverId ? byId.get(hoverId)?.item : null;

  if (items.length === 0) {
    return (
      <div className={cn("relative flex h-full min-h-[420px] w-full items-center justify-center overflow-hidden rounded-3xl aurora-bg", className)}>
        <p className="max-w-sm px-6 text-center font-display text-xl italic text-muted-foreground">
          Your mind is quiet here. Add dreams to see them drift.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full min-h-[420px] w-full touch-none select-none overflow-hidden rounded-3xl aurora-bg",
        className,
      )}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg
        ref={svgRef}
        className="pointer-events-none absolute left-0 top-0 origin-top-left overflow-visible"
        width={WORLD_W}
        height={WORLD_H}
        style={{ transformOrigin: "0 0" }}
      >
        <defs>
          <linearGradient id="cloud-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.08 350)" />
            <stop offset="100%" stopColor="oklch(0.72 0.09 295)" />
          </linearGradient>
          <filter id="cloud-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {connections.map((c) => {
          const a = byId.get(c.from_item_id);
          const b = byId.get(c.to_item_id);
          if (!a || !b) return null;
          const mx = (a.homeX + b.homeX) / 2;
          const my = (a.homeY + b.homeY) / 2 - 40;
          return (
            <path
              key={c.id}
              d={`M ${a.homeX} ${a.homeY} Q ${mx} ${my} ${b.homeX} ${b.homeY}`}
              fill="none"
              stroke="url(#cloud-edge)"
              strokeWidth={1.4}
              strokeDasharray="6 8"
              className="animate-dash"
              filter="url(#cloud-glow)"
              opacity={0.55}
            />
          );
        })}
      </svg>

      <div ref={worldRef} className="absolute left-0 top-0 h-0 w-0">
        {nodes.map((n) => (
          <div
            key={n.id}
            data-node
            ref={(el) => {
              const target = nodesRef.current.find((p) => p.id === n.id);
              if (target) target.el = el;
            }}
            className="group absolute left-0 top-0 cursor-pointer transition-[filter] duration-300"
            style={{ width: n.size, height: n.size, willChange: "transform" }}
            onPointerEnter={() => {
              hoverRef.current = n.id;
              setHoverId(n.id);
            }}
            onPointerLeave={() => {
              if (hoverRef.current === n.id) hoverRef.current = null;
              setHoverId((cur) => (cur === n.id ? null : cur));
            }}
            onClick={(e) => {
              if (dragRef.current.moved) return;
              e.stopPropagation();
              onOpen?.(n.item);
            }}
          >
            <div
              className={cn(
                "h-full w-full overflow-hidden rounded-full shadow-glass ring-1 ring-glass-border transition-shadow duration-300",
                hoverId === n.id && "shadow-glow-rose ring-rose/50",
              )}
            >
              <NodeContent item={n.item} resolveImage={resolveImage} />
            </div>
            {hoverId === n.id && (
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-max max-w-[200px] -translate-x-1/2 rounded-2xl glass-strong px-3 py-2 text-center animate-fade-up">
                <p className="truncate font-display text-sm italic text-foreground">
                  {n.item.title ?? n.item.type}
                </p>
                {n.item.tags.length > 0 && (
                  <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                    {n.item.tags.slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full glass px-2 py-1.5 shadow-glass">
        <button
          type="button"
          onClick={() => zoomBy(-0.15)}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-glass-strong hover:text-foreground"
          aria-label="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <span className="w-10 text-center text-xs text-muted-foreground">{Math.round(zoomTick * 100)}%</span>
        <button
          type="button"
          onClick={() => zoomBy(0.15)}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-glass-strong hover:text-foreground"
          aria-label="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <div className="mx-1 h-5 w-px bg-glass-border" />
        <button
          type="button"
          onClick={recenter}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-glass-strong hover:text-foreground"
          aria-label="Recenter"
        >
          <LocateFixed className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
