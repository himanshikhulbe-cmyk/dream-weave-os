import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ChromeLogo } from "@/components/vision/ui/ChromeLogo";
import chromeCalla from "@/assets/chrome-calla.jpg";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-32 sm:py-40">
      <img
        src={chromeCalla}
        alt=""
        aria-hidden
        loading="lazy"
        width={1024}
        height={1280}
        className="absolute left-1/2 top-1/2 h-[140%] w-auto -translate-x-1/2 -translate-y-1/2 object-cover opacity-[0.12]"
      />
      <div className="absolute inset-0 bg-background/60" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 55, damping: 18 }}
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 text-center"
      >
        <h2 className="font-display text-4xl leading-tight sm:text-6xl">
          Step inside your <em className="italic text-rose">future.</em>
        </h2>
        <Button variant="chrome" size="xl" className="mt-10" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            Create Vision OS
          </Link>
        </Button>
      </motion.div>

      <div className="relative z-10 mx-auto mt-24 flex w-[min(92%,80rem)] flex-col items-center justify-between gap-4 border-t border-glass-border pt-8 text-sm text-muted-foreground sm:flex-row">
        <ChromeLogo compact />
        <p>© 2026 Vision OS</p>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="hover:text-foreground">
            Sign in
          </Link>
          <span aria-hidden>·</span>
          <a href="/demo" className="hover:text-foreground">
            Demo
          </a>
        </div>
      </div>
    </section>
  );
}
