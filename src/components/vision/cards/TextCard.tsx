import { CardFrame, PinLockBadges, CardFooterMeta } from "./cardChrome";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

function sanitize(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

export function TextCard({
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
  const kind = item.text_kind ?? "note";
  const body = item.body ? sanitize(item.body) : "";

  return (
    <CardFrame compact={compact} className={className} onDoubleClick={() => onOpen?.(item)}>
      <PinLockBadges item={item} />
      <div className={cn("flex flex-1 flex-col gap-2 p-4", compact && "p-3 gap-1.5")}>
        {kind === "quote" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="font-display text-3xl text-chrome opacity-60">&ldquo;</span>
            <div
              className={cn(
                "vision-prose font-display italic leading-snug",
                compact ? "text-base" : "text-xl",
              )}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        ) : kind === "goal" ? (
          <div className="flex flex-1 flex-col gap-2">
            <p className="truncate font-display text-lg">{item.title ?? "Untitled goal"}</p>
            <div className="flex items-center gap-3">
              <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--glass-strong)" strokeWidth="4" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="oklch(0.78 0.08 350)"
                  strokeWidth="4"
                  strokeDasharray={`${(2 * Math.PI * 16 * (item.progress ?? 0)) / 100} ${2 * Math.PI * 16}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="min-w-0 text-xs text-muted-foreground">
                {item.deadline && <p>Due {new Date(item.deadline).toLocaleDateString()}</p>}
                {item.target_year && <p>Target {item.target_year}</p>}
              </div>
            </div>
            {!compact && (
              <div
                className="vision-prose text-sm text-muted-foreground line-clamp-3"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
          </div>
        ) : kind === "manifestation" ? (
          <div className="flex flex-1 flex-col justify-center gap-2 rounded-2xl bg-rose/10 p-3 shadow-glow-rose">
            <p className="truncate font-display text-lg italic-accent">{item.title ?? "Manifestation"}</p>
            <div
              className={cn("vision-prose italic", compact ? "text-sm line-clamp-3" : "text-base")}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        ) : kind === "journal" ? (
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="truncate font-display text-lg">{item.title}</p>
            <div
              className={cn("vision-prose text-sm text-muted-foreground", compact ? "line-clamp-3" : "line-clamp-6")}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-1.5">
            <p className="truncate font-display text-lg">{item.title ?? "Untitled"}</p>
            <div
              className={cn("vision-prose text-sm text-muted-foreground", compact ? "line-clamp-3" : "line-clamp-6")}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        )}
      </div>
      <CardFooterMeta item={item} compact={compact} />
    </CardFrame>
  );
}
