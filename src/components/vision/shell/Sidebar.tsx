import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Sparkles, GitBranch, Clock, Wind, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { ChromeLogo } from "@/components/vision/ui/ChromeLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { profileQuery } from "@/lib/vision/api";
import { SectionTree } from "./SectionTree";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/universe", label: "Universe", icon: Sparkles },
  { to: "/app/graph", label: "Graph", icon: GitBranch },
  { to: "/app/timeline", label: "Timeline", icon: Clock },
  { to: "/app/reflect", label: "Reflect", icon: Wind },
] as const;

export function SidebarContent({
  collapsed,
  onToggleCollapse,
  currentSectionId,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  currentSectionId?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useQuery(profileQuery);
  const { signOut } = useAuth();
  const initials = (profile?.display_name ?? "You").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center justify-between px-1">
        <ChromeLogo compact={collapsed} />
        {onToggleCollapse && (
          <Button variant="ghost" size="icon-sm" className="rounded-full" onClick={onToggleCollapse}>
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === "/app" ? pathname === "/app" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-sm transition-colors",
                active ? "glass-strong text-foreground" : "text-foreground/80 hover:bg-glass",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />}
            </Link>
          );
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SectionTree collapsed={collapsed} currentSectionId={currentSectionId} />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border-t border-glass-border pt-3">
        <Link to="/app/profile" className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? "You"} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && <span className="truncate text-sm">{profile?.display_name ?? "You"}</span>}
        </Link>
        <Button variant="ghost" size="icon-sm" className="shrink-0 rounded-full" onClick={() => void signOut()} aria-label="Sign out">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

const COLLAPSE_KEY = "vision-os:sidebar-collapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    if (stored) setCollapsed(stored === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, hydrated]);

  return [collapsed, setCollapsed] as const;
}
