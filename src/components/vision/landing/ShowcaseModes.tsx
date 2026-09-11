import { motion } from "motion/react";
import dreamCloud from "@/assets/dream-cloud.jpg";

const NODES = [
  { label: "Static", x: 8, y: 18 },
  { label: "Focus", x: 88, y: 12 },
  { label: "Random", x: 4, y: 62 },
  { label: "Daily", x: 92, y: 55 },
  { label: "Dream Cloud", x: 50, y: 6 },
  { label: "Timeline", x: 14, y: 92 },
  { label: "Mood", x: 86, y: 90 },
];

const CENTER = { x: 50, y: 50 };

export function ShowcaseModes() {
  return (
    <section className="relative mx-auto w-[min(94%,80rem)] py-28 sm:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-rose">Perspectives</span>
        <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Seven ways to see your <em className="italic text-rose">future</em>
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 50, damping: 18 }}
        className="relative mx-auto mt-16 aspect-[16/10] w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-glass-border shadow-glass"
      >
        <img
          src={dreamCloud}
          alt="Floating chrome orbs representing dream cloud view"
          loading="lazy"
          width={1600}
          height={900}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/35" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mode-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.97 0.008 80)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="oklch(0.78 0.08 350)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          {NODES.map((n) => (
            <line
              key={n.label}
              x1={CENTER.x}
              y1={CENTER.y}
              x2={n.x}
              y2={n.y}
              stroke="url(#mode-line)"
              strokeWidth="0.25"
              strokeDasharray="1.5 1.2"
              className="animate-dash"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {NODES.map((n, i) => (
          <span
            key={n.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full glass px-3 py-1.5 text-[11px] font-medium tracking-wide text-foreground animate-float"
            style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 0.6}s` }}
          >
            {n.label}
          </span>
        ))}
      </motion.div>

      <p className="mx-auto mt-8 max-w-md text-center font-display italic text-muted-foreground">
        The same dreams, seen through seven different lights.
      </p>
    </section>
  );
}
