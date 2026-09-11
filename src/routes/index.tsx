import { createFileRoute } from "@tanstack/react-router";
import { AmbientBackground } from "@/components/vision/ui/AmbientBackground";
import { LandingNav } from "@/components/vision/landing/LandingNav";
import { Hero } from "@/components/vision/landing/Hero";
import { Manifesto } from "@/components/vision/landing/Manifesto";
import { ShowcaseSections } from "@/components/vision/landing/ShowcaseSections";
import { ShowcaseModes } from "@/components/vision/landing/ShowcaseModes";
import { ShowcaseVoice } from "@/components/vision/landing/ShowcaseVoice";
import { ShowcaseGraph } from "@/components/vision/landing/ShowcaseGraph";
import { AiStrip } from "@/components/vision/landing/AiStrip";
import { FinalCta } from "@/components/vision/landing/FinalCta";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Vision OS — Your future shouldn't live on a static board" },
      {
        name: "description",
        content:
          "Build a living universe of dreams, ambitions, goals, memories, inspirations, and future possibilities.",
      },
      { property: "og:title", content: "Vision OS — Your future shouldn't live on a static board" },
      {
        property: "og:description",
        content:
          "Build a living universe of dreams, ambitions, goals, memories, inspirations, and future possibilities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <AmbientBackground />
      <LandingNav />
      <Hero />
      <Manifesto />
      <ShowcaseSections />
      <ShowcaseModes />
      <ShowcaseVoice />
      <ShowcaseGraph />
      <AiStrip />
      <FinalCta />
    </div>
  );
}
