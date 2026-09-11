import { cn } from "@/lib/utils";

/** Vision OS wordmark with a small chrome bloom glyph. */
export function ChromeLogo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid h-8 w-8 shrink-0 place-items-center">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <defs>
            <linearGradient id="vos-chrome" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.97 0.008 80)" />
              <stop offset="40%" stopColor="oklch(0.78 0.015 300)" />
              <stop offset="70%" stopColor="oklch(0.93 0.03 350)" />
              <stop offset="100%" stopColor="oklch(0.68 0.02 290)" />
            </linearGradient>
          </defs>
          {[0, 60, 120, 180, 240, 300].map((r) => (
            <ellipse
              key={r}
              cx="16"
              cy="9.5"
              rx="3.2"
              ry="7"
              fill="url(#vos-chrome)"
              opacity="0.9"
              transform={`rotate(${r} 16 16)`}
            />
          ))}
          <circle cx="16" cy="16" r="3" fill="oklch(0.78 0.08 350)" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-xl tracking-tight text-foreground">
          Vision <span className="italic text-rose">OS</span>
        </span>
      )}
    </span>
  );
}
