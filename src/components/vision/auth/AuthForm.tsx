import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

type Mode = "signin" | "signup" | "reset";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") ? next : "/app";
}

export function AuthForm({ initialMode, next }: { initialMode: Mode; next: string | undefined }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate({ to: safeNext(next) });
    }
  }, [user, next, navigate]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Couldn't sign you in. Check your details.");
      return;
    }
    navigate({ to: safeNext(next) });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Couldn't create your account.");
      return;
    }
    if (!data.session) {
      setCheckInbox(true);
      return;
    }
    navigate({ to: safeNext(next) });
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Couldn't send the reset link.");
      return;
    }
    setResetSent(true);
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Couldn't continue with Google.");
      return;
    }
    if (result.redirected) {
      return;
    }
    setLoading(false);
    navigate({ to: safeNext(next) });
  }

  if (mode === "reset") {
    return (
      <GlassPanel strong className="w-full max-w-md p-8 sm:p-10">
        <h1 className="font-display text-3xl">Reset your password</h1>
        {resetSent ? (
          <p className="mt-6 text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, a reset
            link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleReset} className="mt-8 space-y-5">
            <p className="text-sm text-muted-foreground">
              We'll email you a link to choose a new password.
            </p>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button type="submit" variant="chrome" size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="mt-8 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to sign in
        </button>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong className="w-full max-w-md p-8 sm:p-10">
      <div className="mb-8 flex items-center gap-1 rounded-full glass p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
            mode === "signin" ? "chrome-surface" : "text-muted-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
            mode === "signup" ? "chrome-surface" : "text-muted-foreground"
          }`}
        >
          Create account
        </button>
      </div>

      {checkInbox ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
          <h2 className="font-display text-2xl">Check your inbox</h2>
          <p className="mt-3 text-muted-foreground">
            We sent a confirmation link to <span className="text-foreground">{email}</span>.
            Confirm your email to step inside your universe.
          </p>
        </motion.div>
      ) : (
        <>
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-5">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
            <Button type="submit" variant="chrome" size="lg" className="w-full" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create Vision OS"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-glass-border" />
            or
            <span className="h-px flex-1 bg-glass-border" />
          </div>

          <Button
            type="button"
            variant="glass"
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>
        </>
      )}
    </GlassPanel>
  );
}
