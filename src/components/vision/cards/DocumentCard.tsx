import { useState } from "react";
import { FileType2, FileText, Presentation, File as FileIcon, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mediaUrlQuery } from "@/lib/vision/api";
import { CardFrame, PinLockBadges, CardFooterMeta } from "./cardChrome";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

function glyphFor(mime: string | null | undefined) {
  if (!mime) return FileIcon;
  if (mime.includes("pdf")) return FileType2;
  if (mime.includes("presentation") || mime.includes("powerpoint")) return Presentation;
  if (mime.includes("word") || mime.includes("text")) return FileText;
  return FileIcon;
}

function formatSize(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCard({
  item,
  compact,
  onOpen,
  className,
}: {
  item: VisionItem;
  compact?: boolean | undefined;
  onOpen?: ((item: VisionItem) => void) | undefined;
  className?: string | undefined;
}) {
  const [preview, setPreview] = useState(false);
  const Glyph = glyphFor(item.mime_type);

  return (
    <CardFrame compact={compact} className={className} onDoubleClick={() => onOpen?.(item)}>
      <PinLockBadges item={item} />
      <div className={cn("flex flex-1 flex-col items-start gap-3 p-4", compact && "p-3 gap-2")}>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl glass-strong text-accent">
          <Glyph className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg">{item.title ?? "Document"}</p>
          <p className="text-xs text-muted-foreground">{formatSize(item.file_size)}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreview(true);
          }}
          className="mt-auto rounded-full glass px-3 py-1 text-xs hover:bg-glass-strong"
        >
          Preview
        </button>
      </div>
      <CardFooterMeta item={item} compact={compact} />
      {preview && <DocumentPreview item={item} onClose={() => setPreview(false)} />}
    </CardFrame>
  );
}

function DocumentPreview({ item, onClose }: { item: VisionItem; onClose: () => void }) {
  const { data: url } = useQuery(mediaUrlQuery(item.media_path));
  const mime = item.mime_type ?? "";
  const [text, setText] = useState<string | null>(null);

  const isTxt = mime.includes("text/plain");
  const isPdf = mime.includes("pdf");
  const isOffice = mime.includes("word") || mime.includes("presentation") || mime.includes("powerpoint");

  if (isTxt && url && text === null) {
    void fetch(url)
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText(""));
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-w-3xl border-glass-border">
        <DialogHeader>
          <DialogTitle className="font-display">{item.title ?? "Document"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] min-h-[40vh] overflow-auto rounded-2xl bg-charcoal/40 p-2">
          {!url ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : isPdf ? (
            <object data={url} type="application/pdf" className="h-[65vh] w-full rounded-xl" />
          ) : isTxt ? (
            <pre className="whitespace-pre-wrap p-3 text-xs">{text}</pre>
          ) : isOffice ? (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
              className="h-[65vh] w-full rounded-xl"
              title={item.title ?? "Document preview"}
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <p>Preview unavailable for this file type.</p>
            </div>
          )}
        </div>
        {url && (
          <a
            href={url}
            download
            className="inline-flex items-center gap-1.5 self-start text-xs text-accent hover:underline"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Download original
          </a>
        )}
      </DialogContent>
    </Dialog>
  );
}
