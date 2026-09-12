import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { VisionCard } from "@/components/vision/cards/VisionCard";
import { Button } from "@/components/ui/button";
import {
  createItem,
  deleteItem,
  duplicateItem,
  keys,
  updateItem,
  updateItemPositions,
  uploadMedia,
} from "@/lib/vision/api";
import type { VisionItem } from "@/lib/vision/types";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Pin, Lock, Copy, Trash2, Link2, Layers } from "lucide-react";

type Pos = { x: number; y: number; w: number; h: number; rotation: number; z_index: number };

const CANVAS_W = 3000;
const CANVAS_H = 2000;

function mimeFolder(mime: string) {
  if (mime.startsWith("image/")) return { type: "image" as const, folder: "images" };
  if (mime.startsWith("video/")) return { type: "video" as const, folder: "videos" };
  if (mime.startsWith("audio/")) return { type: "audio" as const, folder: "audio" };
  return { type: "document" as const, folder: "docs" };
}

export function BoardCanvas({
  sectionId,
  items,
  onOpen,
}: {
  sectionId: string;
  items: VisionItem[];
  onOpen: (item: VisionItem) => void;
}) {
  const queryClient = useQueryClient();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, Pos>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<null | {
    kind: "move" | "resize" | "rotate" | "pan";
    ids: string[];
    startX: number;
    startY: number;
    origin: Record<string, Pos>;
    panOrigin?: { x: number; y: number };
  }>(null);

  /** Ids whose local position hasn't been persisted yet — never overwrite those from server data. */
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      for (const it of items) {
        if (pendingRef.current.has(it.id) && next[it.id]) continue;
        next[it.id] = { x: it.x, y: it.y, w: it.w, h: it.h, rotation: it.rotation, z_index: it.z_index };
      }
      for (const id of Object.keys(next)) {
        if (!items.some((it) => it.id === id)) delete next[id];
      }
      return next;
    });
  }, [items]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persist = useCallback(
    (ids: string[], posMap: Record<string, Pos>) => {
      for (const id of ids) pendingRef.current.add(id);
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        const pendingIds = Array.from(pendingRef.current);
        void updateItemPositions(pendingIds.map((id) => ({ id, ...posMap[id]! })))
          .then(() => queryClient.invalidateQueries({ queryKey: keys.items(sectionId) }))
          .finally(() => {
            for (const id of pendingIds) pendingRef.current.delete(id);
          });
      }, 400);
    },
    [queryClient, sectionId],
  );

  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const groupIdsFor = useCallback(
    (id: string) => {
      const it = itemsById.get(id);
      if (!it?.group_id) return [id];
      return items.filter((i) => i.group_id === it.group_id).map((i) => i.id);
    },
    [items, itemsById],
  );

  const onPointerDownItem = (e: React.PointerEvent, id: string, kind: "move" | "resize" | "rotate") => {
    const it = itemsById.get(id);
    if (!it) return;
    if (it.locked && kind !== "rotate") return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);

    let ids = [id];
    if (kind === "move") {
      if (e.shiftKey) {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      } else if (!selected.includes(id)) {
        setSelected([id]);
      }
      const base = e.shiftKey ? selected : selected.includes(id) ? selected : [id];
      const group = new Set<string>();
      for (const sid of base.includes(id) ? base : [id]) {
        for (const gid of groupIdsFor(sid)) group.add(gid);
      }
      ids = Array.from(group);
    }

    dragState.current = {
      kind,
      ids,
      startX: e.clientX,
      startY: e.clientY,
      origin: Object.fromEntries(ids.map((i) => [i, positions[i]!])),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;

    if (ds.kind === "pan" && ds.panOrigin) {
      setPan({ x: ds.panOrigin.x + dx, y: ds.panOrigin.y + dy });
      return;
    }

    setPositions((prev) => {
      const next = { ...prev };
      for (const id of ds.ids) {
        const o = ds.origin[id];
        if (!o) continue;
        if (ds.kind === "move") {
          next[id] = { ...o, x: o.x + dx, y: o.y + dy };
        } else if (ds.kind === "resize") {
          next[id] = { ...o, w: Math.max(80, o.w + dx), h: Math.max(80, o.h + dy) };
        } else if (ds.kind === "rotate") {
          let deg = (dy / 2) % 360;
          if (e.shiftKey) deg = Math.round(deg / 15) * 15;
          else if (Math.abs(deg) < 3) deg = 0;
          next[id] = { ...o, rotation: deg };
        }
      }
      return next;
    });
  };

  const onPointerUp = () => {
    const ds = dragState.current;
    if (ds && ds.kind !== "pan") {
      setPositions((current) => {
        persist(ds.ids, current);
        return current;
      });
    }
    dragState.current = null;
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.target !== e.currentTarget) return;
    setSelected([]);
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = {
      kind: "pan",
      ids: [],
      startX: e.clientX,
      startY: e.clientY,
      origin: {},
      panOrigin: pan,
    };
  };

  const freeSpot = () => {
    const vp = viewportRef.current;
    const cx = vp ? vp.scrollLeft + vp.clientWidth / 2 - pan.x : 400;
    const cy = vp ? vp.scrollTop + vp.clientHeight / 2 - pan.y : 300;
    return { x: cx + Math.random() * 60 - 30, y: cy + Math.random() * 60 - 30 };
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files ?? []);
    for (const file of files) {
      const { type, folder } = mimeFolder(file.type);
      const path = await uploadMedia(file, { folder });
      const { x, y } = freeSpot();
      await createItem({
        section_id: sectionId,
        type,
        title: file.name.replace(/\.[^.]+$/, ""),
        media_path: path,
        mime_type: file.type,
        file_size: file.size,
        x,
        y,
        w: type === "image" ? 280 : 320,
        h: type === "image" ? 220 : type === "audio" ? 140 : 220,
        rotation: 0,
        z_index: items.length + 1,
      });
    }
    if (files.length) {
      toast.success(`Added ${files.length} item${files.length > 1 ? "s" : ""}`);
      void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
      void queryClient.invalidateQueries({ queryKey: keys.allItems });
    }
  };

  const selectionItems = items.filter((i) => selected.includes(i.id));

  const bump = async (dir: 1 | -1) => {
    for (const it of selectionItems) {
      await updateItem(it.id, { z_index: it.z_index + dir });
    }
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
  };
  const togglePin = async () => {
    const next = !selectionItems[0]?.pinned;
    for (const it of selectionItems) await updateItem(it.id, { pinned: next });
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
  };
  const toggleLock = async () => {
    const next = !selectionItems[0]?.locked;
    for (const it of selectionItems) await updateItem(it.id, { locked: next });
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
  };
  const group = async () => {
    const group_id = crypto.randomUUID();
    for (const it of selectionItems) await updateItem(it.id, { group_id });
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
  };
  const ungroup = async () => {
    for (const it of selectionItems) await updateItem(it.id, { group_id: null });
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
  };
  const duplicate = async () => {
    for (const it of selectionItems) await duplicateItem(it);
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
    void queryClient.invalidateQueries({ queryKey: keys.allItems });
  };
  const remove = async () => {
    if (!confirm(`Delete ${selectionItems.length} item(s)? This can't be undone.`)) return;
    for (const it of selectionItems) await deleteItem(it.id);
    setSelected([]);
    void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
    void queryClient.invalidateQueries({ queryKey: keys.allItems });
  };

  return (
    <div
      ref={viewportRef}
      className="relative h-full w-full overflow-auto rounded-3xl"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          backgroundImage: "radial-gradient(oklch(1 0 0 / 8%) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: dragState.current?.kind === "pan" ? "grabbing" : "grab",
        }}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }} className="absolute inset-0">
          {items.map((item) => {
            const pos = positions[item.id];
            if (!pos) return null;
            const isSelected = selected.includes(item.id);
            const zLift = item.pinned ? 5000 : 0;
            return (
              <motion.div
                key={item.id}
                className="absolute touch-none"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: pos.w,
                  height: pos.h,
                  zIndex: pos.z_index + zLift,
                }}
                animate={{ x: 0, y: 0, rotate: pos.rotation }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div
                  onPointerDown={(e) => onPointerDownItem(e, item.id, "move")}
                  className={cn(
                    "h-full w-full rounded-3xl transition-shadow",
                    isSelected && "ring-2 ring-accent shadow-glow-rose",
                  )}
                >
                  <VisionCard item={item} compact onOpen={onOpen} className="h-full w-full" />
                </div>
                {!item.locked && (
                  <>
                    <div
                      onPointerDown={(e) => onPointerDownItem(e, item.id, "resize")}
                      className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-tl bg-glass-strong opacity-0 hover:opacity-100 group-hover/card:opacity-60"
                    />
                    <div
                      onPointerDown={(e) => onPointerDownItem(e, item.id, "rotate")}
                      className="absolute -top-5 left-1/2 h-3 w-3 -translate-x-1/2 cursor-grab rounded-full bg-glass-strong opacity-0 hover:opacity-100"
                    />
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectionItems.length > 0 && (
        <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full glass-strong px-2 py-1.5 shadow-glass">
          <Button variant="ghost" size="icon-sm" onClick={() => bump(1)} title="Bring forward">
            <Layers className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={togglePin} title="Pin">
            <Pin className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={toggleLock} title="Lock">
            <Lock className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={group} title="Group">
            <Link2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="sm" onClick={ungroup} title="Ungroup">
            Ungroup
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={duplicate} title="Duplicate">
            <Copy className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={remove} title="Delete">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      )}
    </div>
  );
}
