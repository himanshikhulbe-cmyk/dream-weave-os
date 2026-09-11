import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ChromeLoader } from "@/components/vision/ui/ChromeLoader";
import { AmbientBackground } from "@/components/vision/ui/AmbientBackground";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { next: location.pathname }, replace: true });
    }
  }, [loading, user, navigate, location.pathname]);

  if (loading || !user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <AmbientBackground />
        <ChromeLoader label="Opening your universe…" />
      </div>
    );
  }

  return <Outlet />;
}
