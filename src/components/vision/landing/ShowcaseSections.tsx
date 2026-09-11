import { motion } from "motion/react";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";

const CARDS = [
  { icon: "🎓", title: "Stanford MS", tag: "Career", progress: 62, rotate: -6, delay: 0 },
  { icon: "🔬", title: "Research", tag: "Growth", progress: 41, rotate: 4, delay: 0.15 },
  { icon: "✈️", title: "Travel", tag: "Life", progress: 78, rotate: -3, delay: 0.3 },
  { icon: "🎨", title: "Creative Projects", tag: "Craft", progress: 24, rotate: 7, delay: 0.45 },
];

export function ShowcaseSections() {
  return (
    <section className="relative mx-auto w-[min(94%,80rem)] py-28 sm:py-36">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-rose">Organize</span>
          <h2 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">
            A universe of <em className="italic text-rose">sections</em>
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">
            Nested, unlimited, entirely yours. No predefined categories, no rigid folders —
            just the shape of your ambitions, structured the way your mind actually works.
          </p>
        </motion.div>

        <div className="relative grid h-[420px] grid-cols-2 gap-6 sm:h-[460px]">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: c.rotate }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 55, damping: 16, delay: c.delay }}
              className={i % 2 === 1 ? "mt-10" : ""}
            >
              <GlassPanel
                lift
                className="flex h-full min-h-[170px] flex-col justify-between p-5 animate-float"
                style={{ animationDelay: `${c.delay * 4}s` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="rounded-full bg-glass-strong px-2.5 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {c.tag}
                  </span>
                </div>
                <div>
                  <p className="font-display text-lg">{c.title}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(1 0 0 / 8%)" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="oklch(0.78 0.08 350)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(c.progress / 100) * 94.2} 94.2`}
                      />
                    </svg>
                    <span className="text-xs text-muted-foreground">{c.progress}%</span>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
