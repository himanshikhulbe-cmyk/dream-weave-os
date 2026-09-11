import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import heroLily from "@/assets/hero-chrome-lily.jpg";

export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 160]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] w-full items-center overflow-hidden pt-24">
      <div className="absolute -right-[10%] top-[-10%] h-[65vh] w-[55vw] rounded-full bg-rose/20 blur-[140px]" />
      <div className="absolute right-[15%] bottom-[-10%] h-[50vh] w-[45vw] rounded-full bg-lavender/20 blur-[130px]" />

      <motion.div
        style={{ y }}
        className="pointer-events-none absolute right-[-8%] top-1/2 hidden w-[46vw] max-w-[640px] -translate-y-1/2 sm:block md:right-[-4%] md:w-[42vw] lg:w-[38vw]"
      >
        <img
          src={heroLily}
          alt="Chrome lily sculpture with pink iridescence"
          width={1280}
          height={1600}
          className="w-full animate-float-slow drop-shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
          fetchPriority="high"
        />
      </motion.div>

      <div className="absolute inset-0 -z-10 sm:hidden">
        <img
          src={heroLily}
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-20"
        />
      </div>

      <div className="relative z-10 mx-auto w-[min(92%,80rem)]">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-3xl font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          Your Future Shouldn&rsquo;t Live On A <em className="italic text-rose">Static Board.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
          className="mt-7 max-w-xl text-lg text-muted-foreground sm:text-xl"
        >
          Build a living universe of dreams, ambitions, goals, memories, inspirations, and future
          possibilities.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Button variant="chrome" size="xl" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Create Vision OS
            </Link>
          </Button>
          <Button variant="glass" size="xl" asChild>
            <a href="/demo">Explore Demo</a>
          </Button>
        </motion.div>
      </div>

      <ScrollHint />
    </section>
  );
}

function ScrollHint() {
  return (
    <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground sm:flex">
      <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
      <span className="h-10 w-px animate-pulse-glow bg-gradient-to-b from-rose to-transparent" />
    </div>
  );
}
