import { cn } from "@/lib/utils";

/**
 * Fixed ambient backdrop: aurora gradient orbs, slow drift, grain, particles.
 * Purely decorative; pointer-events none.
 */
export function AmbientBackground({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden grain", className)}
      style={{ opacity: intensity }}
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute -left-[20%] -top-[30%] h-[70vh] w-[70vw] rounded-full bg-lavender/20 blur-[140px] animate-drift" />
      <div
        className="absolute -right-[15%] top-[10%] h-[60vh] w-[55vw] rounded-full bg-rose/15 blur-[140px] animate-drift"
        style={{ animationDelay: "-12s", animationDirection: "alternate-reverse" }}
      />
      <div className="absolute bottom-[-25%] left-[20%] h-[60vh] w-[70vw] rounded-full bg-midnight blur-[120px] animate-pulse-glow" />
      <Particles />
    </div>
  );
}

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  size: 1 + ((i * 7) % 3),
  delay: -((i * 1.7) % 16),
  duration: 12 + ((i * 3) % 12),
}));

function Particles() {
  return (
    <div className="absolute inset-0">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-pearl/60 animate-float"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            boxShadow: "0 0 8px 1px oklch(0.78 0.08 350 / 60%)",
            opacity: 0.35 + (i % 4) * 0.15,
          }}
        />
      ))}
    </div>
  );
}
