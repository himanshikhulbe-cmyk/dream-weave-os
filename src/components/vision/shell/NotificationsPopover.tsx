import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { keys, markNotificationRead, notificationsQuery } from "@/lib/vision/api";

export function NotificationsPopover() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useQuery(notificationsQuery);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.notifications }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="glass" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose shadow-glow-rose" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass-strong w-80 border-glass-border p-0">
        <div className="border-b border-glass-border px-4 py-3">
          <p className="text-sm font-medium">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Quiet for now — nothing new in your universe.
            </p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.read && readMutation.mutate(n.id)}
              className={cn(
                "flex w-full flex-col gap-0.5 border-b border-glass-border/50 px-4 py-3 text-left transition-colors last:border-none hover:bg-glass",
                !n.read && "bg-glass",
              )}
            >
              <div className="flex items-center gap-2">
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />}
                <span className="truncate text-sm">{n.title}</span>
              </div>
              {n.body && <p className="truncate text-xs text-muted-foreground">{n.body}</p>}
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
