import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MediaImage } from "@/components/vision/cards/MediaImage";
import { cn } from "@/lib/utils";
import { SECTION_COLORS, type Section } from "@/lib/vision/types";
import { createSection, keys, sectionsQuery, updateSection, uploadMedia } from "@/lib/vision/api";
import { descendantIds } from "./sectionTree";
import { X } from "lucide-react";

const EMOJI_SUGGESTIONS = [
  "✨", "🌙", "🌸", "🚀", "🧭", "📚", "💼", "🏔️", "🎨", "🧘",
  "💫", "🌊", "🔥", "🌿", "🎯", "🗺️", "💎", "🪐", "🌺", "🎬",
  "🧠", "🏡", "💌", "🕊️",
];

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: Section | null;
  parentId?: string | null;
}

export function SectionDialog({ open, onOpenChange, section, parentId }: SectionDialogProps) {
  const queryClient = useQueryClient();
  const { data: sections = [] } = useQuery(sectionsQuery);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState<string>(SECTION_COLORS[0] ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [parent, setParent] = useState<string>("none");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(section?.name ?? "");
    setDescription(section?.description ?? "");
    setIcon(section?.icon ?? "");
    setColor(section?.color ?? SECTION_COLORS[0] ?? "");
    setTags(section?.tags ?? []);
    setTagInput("");
    setParent(section?.parent_id ?? parentId ?? "none");
    setCoverUrl(section?.cover_url ?? null);
  }, [open, section, parentId]);

  const disallowedParentIds = useMemo(() => {
    if (!section) return new Set<string>();
    return descendantIds(sections, section.id);
  }, [sections, section]);

  const parentOptions = sections.filter((s) => !disallowedParentIds.has(s.id));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const patch = {
        name: name.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
        color,
        tags,
        parent_id: parent === "none" ? null : parent,
        cover_url: coverUrl,
      };
      if (section) return updateSection(section.id, patch);
      return createSection({ ...patch, sort_order: sections.length });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.sections });
      toast.success(section ? "Section updated" : "Section created");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function addTag() {
    const t = tagInput.trim().replace(/,$/, "");
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  async function handleCoverChange(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadMedia(file, { folder: "covers" });
      setCoverUrl(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[85vh] max-w-lg overflow-y-auto border-glass-border sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {section ? "Edit section" : "New section"}
          </DialogTitle>
          <DialogDescription>
            A place to gather the pieces of one part of your universe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Career" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What lives here?"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Icon</label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="✨" maxLength={4} />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-base transition-transform hover:scale-110",
                    icon === emoji ? "glass-strong shadow-glow-rose" : "glass",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Color</label>
            <div className="flex flex-wrap gap-2">
              {SECTION_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                    color === c ? "ring-chrome" : "ring-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="add a tag…"
                className="h-7 w-28 border-none bg-transparent px-1 text-xs focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Parent section
            </label>
            <Select value={parent} onValueChange={setParent}>
              <SelectTrigger>
                <SelectValue placeholder="None (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top-level)</SelectItem>
                {parentOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.icon ? `${s.icon} ` : ""}
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Cover image
            </label>
            {coverUrl ? (
              <div className="relative h-28 w-full overflow-hidden rounded-2xl">
                <MediaImage path={coverUrl} alt="Cover" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverUrl(null)}
                  className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-background/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => void handleCoverChange(e.target.files?.[0])}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="chrome"
            disabled={!name.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {section ? "Save changes" : "Create section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
