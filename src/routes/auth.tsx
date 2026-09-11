import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AmbientBackground } from "@/components/vision/ui/AmbientBackground";
import { ChromeLogo } from "@/components/vision/ui/ChromeLogo";
import { AuthVisual } from "@/components/vision/auth/AuthVisual";
import { AuthForm } from "@/components/vision/auth/AuthForm";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    next: z.string().optional(),
    mode: z.enum(["signin", "signup", "reset"]).optional(),
  }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Vision OS" },
      { name: "description", content: "Sign in or create your Vision OS to build a living universe of dreams." },
      { property: "og:title", content: "Sign in — Vision OS" },
      { property: "og:description", content: "Sign in or create your Vision OS to build a living universe of dreams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function AuthPage() {
  const { next, mode } = Route.useSearch();

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <AmbientBackground />
      <AuthVisual />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <Link to="/" className="mb-10">
          <ChromeLogo />
        </Link>
        <AuthForm initialMode={mode ?? "signin"} next={next} />
      </div>
    </div>
  );
}
