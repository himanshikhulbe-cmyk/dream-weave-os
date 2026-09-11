import { useEffect, useRef, useState } from "react";
import { Play, Pause, FileText as TranscriptIcon } from "lucide-react";
import { useMediaUrl } from "./MediaImage";
import { CardFrame, PinLockBadges, CardFooterMeta } from "./cardChrome";
import type { VisionItem } from "@/lib/vision/types";
import { cn } from "@/lib/utils";

function formatDuration(sec: number | null | undefined) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function staticBars(id: string) {
  const bars: number[] = [];
  for (let i = 0; i < 32; i++) {
    const c = id.charCodeAt(i % id.length) || 50;
    bars.push(20 + ((c * (i + 1)) % 80));
  }
  return bars;
}

export function AudioCard({
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
  const url = useMediaUrl(item.media_path);
  const waveRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<import("wavesurfer.js").default | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (compact || !started || !url || !waveRef.current) return;
    let cancelled = false;
    void import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (cancelled || !waveRef.current) return;
      const ws = WaveSurfer.create({
        container: waveRef.current,
        waveColor: "oklch(0.72 0.09 295)",
        progressColor: "oklch(0.78 0.08 350)",
        height: 48,
        cursorWidth: 1,
        barWidth: 2,
        barGap: 2,
        barRadius: 2,
      });
      ws.load(url);
      ws.on("ready", () => setReady(true));
      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => setPlaying(false));
      wsRef.current = ws;
    });
    return () => {
      cancelled = true;
      wsRef.current?.destroy();
      wsRef.current = null;
    };
  }, [compact, started, url]);

  const toggle = () => {
    if (!started) {
      setStarted(true);
      return;
    }
    wsRef.current?.playPause();
  };

  return (
    <CardFrame compact={compact} className={className} onDoubleClick={() => onOpen?.(item)}>
      <PinLockBadges item={item} />
      <div className={cn("flex flex-col gap-3 p-4", compact && "gap-2 p-3")}>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full chrome-surface transition-transform hover:scale-105"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Play className="ml-0.5 h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg">{item.title ?? "Voice note"}</p>
            <p className="text-xs text-muted-foreground">{formatDuration(item.duration_seconds)}</p>
          </div>
          {item.transcript && !compact && (
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground"
              aria-label="Toggle transcript"
            >
              <TranscriptIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {compact ? (
          <div className="flex h-8 items-end gap-[2px]">
            {staticBars(item.id).map((h, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-lavender/50"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        ) : (
          <div ref={waveRef} className={cn("min-h-[48px] w-full", !ready && "opacity-0")} />
        )}

        {!compact && showTranscript && item.transcript && (
          <p className="rounded-2xl bg-glass-strong p-3 text-xs italic text-muted-foreground">
            {item.transcript}
          </p>
        )}
        {!compact && item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
      </div>
      <CardFooterMeta item={item} compact={compact} />
    </CardFrame>
  );
}
