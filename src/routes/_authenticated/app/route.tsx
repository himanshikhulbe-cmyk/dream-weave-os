import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AmbientBackground } from "@/components/vision/ui/AmbientBackground";
import { SidebarContent, useSidebarCollapsed } from "@/components/vision/shell/Sidebar";
import { TopBar } from "@/components/vision/shell/TopBar";
import { GlobalSearch } from "@/components/vision/shell/GlobalSearch";
import { profileQuery } from "@/lib/vision/api";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  useQuery(profileQuery);
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sectionMatch = pathname.match(/\/app\/sections\/([^/]+)/);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside
        className={`relative m-3 hidden shrink-0 rounded-3xl glass-strong transition-[width] duration-300 md:flex ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          currentSectionId={sectionMatch?.[1]}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenSearch={() => setSearchOpen(true)} />
        <main className="relative flex-1 min-w-0 overflow-auto">
          <AmbientBackground />
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
