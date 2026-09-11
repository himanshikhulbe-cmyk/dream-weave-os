import { MediaImage } from "./MediaImage";
import { CardFrame, PinLockBadges, TypeGlyph, CardFooterMeta } from "./cardChrome";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

export function ImageCard({
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
  return (
    <CardFrame compact={compact} className={className} onDoubleClick={() => onOpen?.(item)}>
      <PinLockBadges item={item} />
      <div className={cn("relative w-full overflow-hidden", compact ? "aspect-square" : "aspect-[4/3]")}>
        <MediaImage
          path={item.media_path}
          alt={item.title ?? "Vision image"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3.5 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
          <div className="flex items-center gap-1.5 text-pearl">
            <TypeGlyph type="image" className="h-3.5 w-3.5" />
            <p className="truncate font-display text-lg">{item.title ?? "Untitled"}</p>
          </div>
          {item.caption && <p className="mt-0.5 truncate text-xs text-pearl/80">{item.caption}</p>}
        </div>
      </div>
      {!compact && (
        <div className="px-3.5 pt-3">
          <p className="truncate font-display text-lg">{item.title ?? "Untitled"}</p>
        </div>
      )}
      <CardFooterMeta item={item} compact={compact} />
    </CardFrame>
  );
}
