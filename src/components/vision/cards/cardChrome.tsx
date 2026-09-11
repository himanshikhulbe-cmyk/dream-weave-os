import type { ReactNode } from "react";
import { Pin, Lock, FileText, ImageIcon, Video, Mic, FileType2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemType, VisionItem } from "@/lib/vision/types";
import { STATUSES } from "@/lib/vision/types";

export const TYPE_GLYPHS: Record<ItemType, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  audio: Mic,
  document: FileType2,
};

export function TypeGlyph({ type, className }: { type: ItemType; className?: string }) {
  const Glyph = TYPE_GLYPHS[type];
  return <Glyph className={cn("shrink-0", className)} strokeWidth={1.5} />;
}

const STATUS_TONE: Record<string, string> = {
  idea: "bg-muted-foreground",
  planned: "bg-lavender",
  in_progress: "bg-rose",
  completed: "bg-chrome",
  archived: "bg-muted-foreground/50",
};

/** Outer frame shared by all card types: glass, rounded-3xl, iridescent hover border. */
export function CardFrame({
  children,
  className,
  compact,
  onDoubleClick,
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string | undefined;
  compact?: boolean | undefined;
  onDoubleClick?: (() => void) | undefined;
  onClick?: (() => void) | undefined;
  style?: React.CSSProperties | undefined;
}) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={style}
      className={cn(
        "group/card relative flex h-full w-full flex-col overflow-hidden rounded-3xl glass",
        "transition-all duration-300 hover:shadow-glow-lavender",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        "before:bg-[linear-gradient(120deg,oklch(0.78_0.08_350/0.5),oklch(0.72_0.09_295/0.5),oklch(0.86_0.05_80/0.4))] before:p-px before:[mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)]",
        compact ? "text-sm" : "text-base",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PinLockBadges({ item }: { item: VisionItem }) {
  if (!item.pinned && !item.locked) return null;
  return (
    <div className="absolute right-2 top-2 z-10 flex gap-1">
      {item.pinned && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full glass-strong text-accent">
          <Pin className="h-3 w-3" strokeWidth={1.5} />
        </span>
      )}
      {item.locked && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full glass-strong text-muted-foreground">
          <Lock className="h-3 w-3" strokeWidth={1.5} />
        </span>
      )}
    </div>
  );
}

export function TagPills({ tags, className }: { tags: string[] | null | undefined; className?: string }) {
  if (!tags?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.slice(0, 4).map((t) => (
        <span key={t} className="rounded-full glass px-2 py-0.5 text-[10px] text-muted-foreground">
          {t}
        </span>
      ))}
    </div>
  );
}

export function MoodChips({ moods, className }: { moods: string[] | null | undefined; className?: string }) {
  if (!moods?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {moods.slice(0, 2).map((m) => (
        <span
          key={m}
          className="rounded-full bg-rose/15 px-2 py-0.5 text-[10px] italic-accent text-accent"
        >
          {m}
        </span>
      ))}
    </div>
  );
}

export function StatusDot({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  const label = STATUSES.find((s) => s.id === status)?.label ?? status;
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_TONE[status] ?? "bg-muted-foreground")} />
      {label}
    </span>
  );
}

export function ProgressBar({ progress }: { progress: number | null | undefined }) {
  if (!progress || progress <= 0) return null;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-glass-strong">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.72_0.09_295),oklch(0.78_0.08_350))]"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  );
}

export function CardFooterMeta({ item, compact }: { item: VisionItem; compact?: boolean | undefined }) {
  return (
    <div className={cn("mt-auto flex flex-col gap-1.5 px-3.5 pb-3.5", compact && "px-3 pb-3")}>
      <div className="flex items-center justify-between gap-2">
        <TagPills tags={item.tags} />
        <StatusDot status={item.status} />
      </div>
      <MoodChips moods={item.moods} />
      <ProgressBar progress={item.progress} />
    </div>
  );
}
