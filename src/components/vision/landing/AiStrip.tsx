import { motion } from "motion/react";

const QUOTES = [
  { label: "AI Reflection", text: "You consistently focus on learning and research." },
  { label: "AI Reminder", text: "You haven't visited your Startup section in 48 days." },
  {
    label: "Future Self",
    text: "The effort you're investing today is shaping opportunities you haven't even imagined yet.",
  },
];

export function AiStrip() {
  return (
    <section className="relative mx-auto w-[min(94%,80rem)] py-24 sm:py-32">
      <div className="grid gap-5 sm:grid-cols-3">
        {QUOTES.map((q, i) => (
          <motion.div
            key={q.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 60, damping: 18, delay: i * 0.12 }}
            className="rounded-3xl glass p-6"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-rose">{q.label}</span>
            <p className="mt-3 font-display italic leading-snug text-foreground/90">
              &ldquo;{q.text}&rdquo;
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
