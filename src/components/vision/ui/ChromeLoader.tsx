import { cn } from "@/lib/utils";

export function ChromeLoader({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full chrome-surface opacity-80 animate-spin-slow [animation-duration:6s]" />
        <div className="absolute inset-[3px] rounded-full bg-background" />
        <div className="absolute inset-[9px] rounded-full bg-rose/30 blur-md animate-pulse-glow" />
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
