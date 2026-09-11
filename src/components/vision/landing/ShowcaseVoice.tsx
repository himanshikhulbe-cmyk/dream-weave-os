import { motion } from "motion/react";
import { Play } from "lucide-react";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import chromeCalla from "@/assets/chrome-calla.jpg";

const BARS = Array.from({ length: 28 }, (_, i) => 18 + ((i * 37) % 60));

export function ShowcaseVoice() {
  return (
    <section className="relative mx-auto w-[min(94%,80rem)] py-28 sm:py-36">
      <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="grid gap-5 sm:grid-cols-2 lg:order-2"
        >
          <GlassPanel lift className="col-span-2 p-5">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full chrome-surface">
                <Play className="h-4 w-4 fill-current" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Voice note · 1:24</p>
                <p className="truncate text-xs text-muted-foreground">
                  &ldquo;...someday I want to wake up in Kyoto and just walk...&rdquo;
                </p>
              </div>
            </div>
            <div className="mt-4 flex h-10 items-end gap-[3px]">
              {BARS.map((h, i) => (
                <span
                  key={i}
                  className="w-full flex-1 rounded-full bg-rose/60 animate-pulse-glow"
                  style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }}
                />
              ))}
            </div>
          </GlassPanel>

          <GlassPanel lift className="p-5">
            <p className="font-display italic leading-snug">
              &ldquo;I am building the life I once only dared to whisper about.&rdquo;
            </p>
          </GlassPanel>

          <GlassPanel lift className="overflow-hidden p-0">
            <img
              src={chromeCalla}
              alt="Chrome calla lily sculpture"
              loading="lazy"
              width={1024}
              height={1280}
              className="h-full w-full object-cover"
            />
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
          className="lg:order-1"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-rose">Voice</span>
          <h2 className="mt-4 max-w-md font-display text-4xl leading-tight sm:text-5xl">
            Your voice is <em className="italic text-rose">first-class</em>
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">
            Some dreams are easier spoken than typed. Record a voice note at 2am, drop in a
            quote that stopped you mid-scroll, or pin the one photo that says it all — every
            format lives together, equally.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
