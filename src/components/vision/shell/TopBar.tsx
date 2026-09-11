import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { sectionsQuery, profileQuery } from "@/lib/vision/api";
import { sectionPath } from "./sectionTree";
import { SidebarContent } from "./Sidebar";
import { NotificationsPopover } from "./NotificationsPopover";

const ROUTE_LABELS: Record<string, string> = {
  "/app": "Dashboard",
  "/app/universe": "Universe",
  "/app/graph": "Graph",
  "/app/timeline": "Timeline",
  "/app/reflect": "Reflect",
  "/app/profile": "Profile",
};

export function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: sections = [] } = useQuery(sectionsQuery);
  const { data: profile } = useQuery(profileQuery);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionMatch = pathname.match(/\/app\/sections\/([^/]+)/);
  const sectionId = sectionMatch?.[1];
  const path = sectionId ? sectionPath(sections, sectionId) : [];
  const title = path.length > 0 ? path[path.length - 1]?.name : ROUTE_LABELS[pathname] ?? "Vision OS";
  const initials = (profile?.display_name ?? "You").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-sm md:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="glass" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-none bg-transparent p-0">
          <div className="glass-strong h-full rounded-r-3xl">
            <SidebarContent collapsed={false} currentSectionId={sectionId} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg text-foreground">{title}</p>
        {path.length > 1 && (
          <p className="truncate text-xs text-muted-foreground">
            {path.slice(0, -1).map((s) => s.name).join(" / ")}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className="glass hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-glass-strong sm:flex"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
        Search
        <kbd className="rounded-full bg-glass-strong px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <Button variant="glass" size="icon" className="sm:hidden" onClick={onOpenSearch} aria-label="Search">
        <Search className="h-4 w-4" strokeWidth={1.5} />
      </Button>

      <Button variant="chrome" size="sm" className="hidden rounded-full md:inline-flex" asChild>
        <Link to="/app/universe" search={{ shuffle: "1" } as never}>
          <Sparkles className="h-3.5 w-3.5" /> Surprise Me
        </Link>
      </Button>

      <NotificationsPopover />

      <Link to="/app/profile">
        <Avatar className="h-8 w-8">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "You"} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}
