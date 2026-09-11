import { Link } from "@tanstack/react-router";
import { ChromeLogo } from "@/components/vision/ui/ChromeLogo";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <nav className="fixed inset-x-0 top-4 z-50 mx-auto flex w-[min(92%,72rem)] items-center justify-between rounded-full px-5 py-3 glass shadow-glass">
      <Link to="/">
        <ChromeLogo />
      </Link>
      <div className="flex items-center gap-2.5">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
        <Button variant="chrome" size="sm" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            Create Vision OS
          </Link>
        </Button>
      </div>
    </nav>
  );
}
