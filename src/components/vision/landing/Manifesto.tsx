import { motion } from "motion/react";
import chromeTexture from "@/assets/chrome-texture.jpg";

export function Manifesto() {
  return (
    <section className="relative flex h-[46vh] min-h-[320px] w-full items-center justify-center overflow-hidden">
      <img
        src={chromeTexture}
        alt=""
        aria-hidden
        loading="lazy"
        width={1600}
        height={900}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        }}
      />
      <div className="absolute inset-0 bg-background/40" />
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
        className="relative z-10 mx-auto max-w-3xl px-6 text-center font-display text-2xl italic leading-snug text-foreground sm:text-3xl lg:text-4xl"
      >
        Most vision boards die on a wall.{" "}
        <span className="text-rose">Yours should breathe.</span>
      </motion.p>
    </section>
  );
}
