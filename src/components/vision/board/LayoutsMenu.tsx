import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, Trash2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteLayout,
  keys,
  layoutsQuery,
  saveLayout,
  updateItemPositions,
  type LayoutPositions,
} from "@/lib/vision/api";
import type { VisionItem, ViewMode } from "@/lib/vision/types";

export function LayoutsMenu({
  sectionId,
  items,
  mode,
}: {
  sectionId: string;
  items: VisionItem[];
  mode: ViewMode;
}) {
  const queryClient = useQueryClient();
  const { data: layouts = [] } = useQuery(layoutsQuery);
  const mine = layouts.filter((l) => l.section_id === sectionId);
  const [name, setName] = useState("");

  const save = useMutation({
    mutationFn: () => {
      const positions: LayoutPositions = {};
      for (const it of items) {
        positions[it.id] = { x: it.x, y: it.y, w: it.w, h: it.h, rotation: it.rotation, z_index: it.z_index };
      }
      return saveLayout({ name: name || `Layout ${mine.length + 1}`, section_id: sectionId, mode, positions });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.layouts });
      setName("");
      toast.success("Layout saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apply = useMutation({
    mutationFn: async (positions: LayoutPositions) => {
      const updates = items
        .filter((it) => positions[it.id])
        .map((it) => ({ id: it.id, ...positions[it.id]! }));
      await updateItemPositions(updates);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
      toast.success("Layout applied");
    },
  });

  const remove = useMutation({
    mutationFn: deleteLayout,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.layouts }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="sm" className="rounded-full">
          <Bookmark className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Layouts</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-strong w-64 border-glass-border">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Saved layouts
        </DropdownMenuLabel>
        {mine.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No saved layouts for this section.</p>
        )}
        {mine.map((l) => (
          <DropdownMenuItem
            key={l.id}
            className="flex items-center justify-between gap-2"
            onSelect={() => apply.mutate(l.positions as unknown as LayoutPositions)}
          >
            <span className="truncate">{l.name}</span>
            <button
              type="button"
              aria-label="Delete layout"
              className="rounded-full p-1 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                remove.mutate(l.id);
              }}
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1.5 p-1.5" onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="Name this arrangement"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="icon-sm"
            variant="chrome"
            className="shrink-0 rounded-full"
            aria-label="Save current layout"
            onClick={() => save.mutate()}
            disabled={save.isPending || items.length === 0}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
