import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AmbientBackground } from "@/components/vision/ui/AmbientBackground";
import { ChromeLogo } from "@/components/vision/ui/ChromeLogo";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
  head: () => ({
    meta: [
      { title: "Reset password — Vision OS" },
      { name: "description", content: "Choose a new password for your Vision OS." },
      { property: "og:title", content: "Reset password — Vision OS" },
      { property: "og:description", content: "Choose a new password for your Vision OS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ResetPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Couldn't update your password.");
      return;
    }
    toast.success("Password updated. Welcome back.");
    navigate({ to: "/app" });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <AmbientBackground />
      <Link to="/" className="mb-10">
        <ChromeLogo />
      </Link>

      <GlassPanel strong className="w-full max-w-md p-8 sm:p-10">
        <h1 className="font-display text-3xl">Choose a new password</h1>

        {authLoading ? (
          <p className="mt-6 text-muted-foreground">Verifying your link…</p>
        ) : !user ? (
          <div className="mt-6 space-y-4">
            <p className="text-muted-foreground">
              This reset link is invalid or has expired. Request a fresh one to continue.
            </p>
            <Button variant="chrome" size="lg" className="w-full" asChild>
              <Link to="/auth" search={{ mode: "reset" }}>
                Back to reset
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" variant="chrome" size="lg" className="w-full" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </GlassPanel>
    </div>
  );
}
