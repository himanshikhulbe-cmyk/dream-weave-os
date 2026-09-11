import { useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { useMediaUrl } from "./MediaImage";
import { CardFrame, PinLockBadges, TypeGlyph, CardFooterMeta } from "./cardChrome";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function VideoCard({
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const url = useMediaUrl(item.embed_url ? null : item.media_path);

  const goFullscreen = () => {
    const el = wrapRef.current;
    if (el?.requestFullscreen) void el.requestFullscreen();
  };

  return (
    <CardFrame compact={compact} className={className} onDoubleClick={() => onOpen?.(item)}>
      <PinLockBadges item={item} />
      <div
        ref={wrapRef}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn("relative w-full overflow-hidden bg-charcoal", compact ? "aspect-square" : "aspect-video")}
      >
        {item.embed_url ? (
          <iframe
            src={toEmbedUrl(item.embed_url)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.title ?? "Video"}
          />
        ) : url ? (
          <video src={url} controls playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full animate-pulse bg-glass-strong" />
        )}
        {!item.embed_url && hover && (
          <button
            onClick={goFullscreen}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full glass-strong text-pearl transition-transform hover:scale-105"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-3.5 pt-3">
        <TypeGlyph type="video" className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="truncate font-display text-lg">{item.title ?? "Untitled"}</p>
      </div>
      <CardFooterMeta item={item} compact={compact} />
    </CardFrame>
  );
}
