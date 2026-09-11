import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  Mic,
  Target,
  Video,
  Layers,
} from "lucide-react";
import { allItemsQuery, sectionsQuery } from "@/lib/vision/api";
import { isGoal, type Section, type VisionItem } from "@/lib/vision/types";

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function snippet(haystack: string, query: string, length = 90): string {
  if (!query) return haystack.slice(0, length);
  const idx = haystack.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return haystack.slice(0, length);
  const start = Math.max(0, idx - 30);
  return `${start > 0 ? "…" : ""}${haystack.slice(start, start + length)}…`;
}

function matches(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.toLowerCase();
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

interface ItemGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: VisionItem[];
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: items = [] } = useQuery(allItemsQuery);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredSections = useMemo<Section[]>(() => {
    if (!query) return sections.slice(0, 6);
    return sections.filter((s) =>
      matches(query, s.name, s.description, ...(s.tags ?? [])),
    );
  }, [sections, query]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => {
      if (!q) return false;
      return matches(
        q,
        it.title,
        stripHtml(it.body),
        it.caption,
        it.notes,
        it.transcript,
        ...(it.tags ?? []),
        ...(it.moods ?? []),
      );
    });
  }, [items, query]);

  const groups: ItemGroup[] = useMemo(
    () => [
      { label: "Goals", icon: Target, items: filteredItems.filter((i) => isGoal(i)) },
      {
        label: "Notes & quotes",
        icon: BookOpen,
        items: filteredItems.filter((i) => i.type === "text" && !isGoal(i)),
      },
      { label: "Images", icon: ImageIcon, items: filteredItems.filter((i) => i.type === "image") },
      { label: "Voice notes", icon: Mic, items: filteredItems.filter((i) => i.type === "audio") },
      { label: "Videos", icon: Video, items: filteredItems.filter((i) => i.type === "video") },
      { label: "Documents", icon: FileText, items: filteredItems.filter((i) => i.type === "document") },
    ],
    [filteredItems],
  );

  function openSection(sectionId: string) {
    onOpenChange(false);
    void navigate({ to: "/app/sections/$sectionId", params: { sectionId } });
  }

  function openItem(item: VisionItem) {
    if (!item.section_id) return;
    onOpenChange(false);
    void navigate({
      to: "/app/sections/$sectionId",
      params: { sectionId: item.section_id },
      search: { item: item.id } as never,
    });
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search your universe…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nothing found in your universe yet.</CommandEmpty>

        {filteredSections.length > 0 && (
          <CommandGroup heading="Sections">
            {filteredSections.map((s) => (
              <CommandItem key={s.id} value={`section-${s.id}-${s.name}`} onSelect={() => openSection(s.id)}>
                <Layers className="mr-1 text-rose" />
                <span className="truncate">
                  {s.icon ? `${s.icon} ` : ""}
                  {s.name}
                </span>
                {(s.tags ?? []).slice(0, 2).map((t) => (
                  <Badge key={t} variant="secondary" className="ml-2 rounded-full text-[10px]">
                    {t}
                  </Badge>
                ))}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.slice(0, 8).map((item) => {
                const Icon = group.icon;
                const text = stripHtml(item.body) || item.caption || item.notes || item.transcript || "";
                return (
                  <CommandItem
                    key={item.id}
                    value={`item-${item.id}-${item.title ?? ""}`}
                    onSelect={() => openItem(item)}
                  >
                    <Icon className="mr-1 text-lavender" />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{item.title || "Untitled"}</span>
                      {text && (
                        <span className="truncate text-xs text-muted-foreground">
                          {snippet(text, query)}
                        </span>
                      )}
                    </div>
                    {(item.tags ?? []).slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" className="ml-2 shrink-0 rounded-full text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
      </CommandList>
    </CommandDialog>
  );
}
