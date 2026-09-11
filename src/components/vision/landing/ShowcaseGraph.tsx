import { motion } from "motion/react";

const NODES = [
  { label: "Learn DSA", x: 40, y: 40 },
  { label: "Get Internship", x: 200, y: 40 },
  { label: "Research Experience", x: 360, y: 40 },
  { label: "Stanford MS", x: 520, y: 40 },
  { label: "AI Research Career", x: 680, y: 40 },
];

export function ShowcaseGraph() {
  return (
    <section className="relative mx-auto w-[min(94%,80rem)] py-28 sm:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-rose">Meaning</span>
        <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          Connected <em className="italic text-rose">dreams</em>
        </h2>
        <p className="mt-6 text-muted-foreground">
          Nothing you build lives in isolation. Draw the invisible threads between goals and
          watch the path to your future take shape.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 55, damping: 18 }}
        className="mt-16 overflow-x-auto"
      >
        <svg viewBox="0 0 740 80" className="mx-auto h-auto min-w-[720px] max-w-full">
          <defs>
            <linearGradient id="graph-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.78 0.08 350)" />
              <stop offset="100%" stopColor="oklch(0.97 0.008 80)" />
            </linearGradient>
          </defs>
          {NODES.slice(0, -1).map((n, i) => {
            const next = NODES[i + 1];
            if (!next) return null;
            return (
              <path
                key={n.label}
                d={`M ${n.x + 26} ${n.y} L ${next.x - 26} ${next.y}`}
                stroke="url(#graph-line)"
                strokeWidth="1.5"
                strokeDasharray="6 5"
                fill="none"
                className="animate-dash"
              />
            );
          })}
          {NODES.map((n) => (
            <g key={n.label}>
              <circle
                cx={n.x}
                cy={n.y}
                r="14"
                fill="oklch(1 0 0 / 6%)"
                stroke="oklch(0.78 0.08 350 / 60%)"
                strokeWidth="1"
              />
              <text
                x={n.x}
                y={n.y + 34}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: "10px", letterSpacing: "0.02em" }}
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </motion.div>
    </section>
  );
}
