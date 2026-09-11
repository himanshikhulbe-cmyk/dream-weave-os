import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createItem, keys, uploadMedia } from "@/lib/vision/api";
import { MOODS, TEXT_KINDS, type ItemType, type TextKind } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

export function CreateItemDialog({
  sectionId,
  type,
  open,
  onOpenChange,
}: {
  sectionId: string;
  type: ItemType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [textKind, setTextKind] = useState<TextKind>("note");
  const [moods, setMoods] = useState<string[]>([]);
  const [embedUrl, setEmbedUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle("");
    setBody("");
    setTextKind("note");
    setMoods([]);
    setEmbedUrl("");
    setFile(null);
  };

  const submit = async () => {
    setSaving(true);
    try {
      let media_path: string | null = null;
      let mime_type: string | null = null;
      let file_size: number | null = null;
      if (file && type !== "text") {
        const folder = type === "image" ? "images" : type === "video" ? "videos" : type === "audio" ? "audio" : "docs";
        media_path = await uploadMedia(file, { folder });
        mime_type = file.type || null;
        file_size = file.size;
      }
      await createItem({
        section_id: sectionId,
        type,
        title: title || (file ? file.name.replace(/\.[^.]+$/, "") : "Untitled"),
        body: type === "text" ? body : null,
        text_kind: type === "text" ? textKind : null,
        moods,
        embed_url: type === "video" && embedUrl ? embedUrl : null,
        media_path,
        mime_type,
        file_size,
        x: 200 + Math.random() * 200,
        y: 200 + Math.random() * 200,
        w: type === "image" ? 280 : 320,
        h: type === "audio" ? 150 : type === "image" ? 220 : 240,
        rotation: 0,
        z_index: 1,
      });
      toast.success("Added to your universe");
      void queryClient.invalidateQueries({ queryKey: keys.items(sectionId) });
      void queryClient.invalidateQueries({ queryKey: keys.allItems });
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create item");
    } finally {
      setSaving(false);
    }
  };

  const label = type === "audio" ? "Voice note" : type[0]!.toUpperCase() + type.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-lg border-glass-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">New {label}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

          {type === "text" && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {TEXT_KINDS.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setTextKind(k.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs",
                      textKind === k.id ? "chrome-surface" : "glass text-muted-foreground",
                    )}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Write your dream…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
              />
            </>
          )}

          {(type === "image" || type === "video" || type === "audio" || type === "document") && (
            <input
              type="file"
              accept={
                type === "image"
                  ? "image/*"
                  : type === "video"
                    ? "video/*"
                    : type === "audio"
                      ? "audio/*"
                      : ".pdf,.docx,.pptx,.txt"
              }
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-2xl glass p-3 text-sm"
            />
          )}

          {type === "video" && (
            <Input
              placeholder="or paste a YouTube / Vimeo / video URL"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
            />
          )}

          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px]",
                  moods.includes(m) ? "bg-rose/25 text-accent" : "glass text-muted-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <Button variant="chrome" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Add to board"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
