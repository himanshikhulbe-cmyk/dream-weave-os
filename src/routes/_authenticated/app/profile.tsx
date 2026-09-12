import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassPanel } from "@/components/vision/ui/GlassPanel";
import { profileQuery, sectionsQuery, allItemsQuery, updateProfile, keys } from "@/lib/vision/api";
import { isGoal } from "@/lib/vision/types";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Vision OS" },
      { name: "description", content: "Your account, your presence in the universe." },
      { property: "og:title", content: "Profile — Vision OS" },
      { property: "og:description", content: "Your account, your presence in the universe." },
    ],
  }),
  component: ProfilePage,
});

function initials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const profile = useQuery(profileQuery);
  const sections = useQuery(sectionsQuery);
  const items = useQuery(allItemsQuery);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile.data) {
      setDisplayName(profile.data.display_name ?? "");
      setBio(profile.data.bio ?? "");
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => updateProfile({ display_name: displayName || null, bio: bio || null }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.profile });
      toast.success("Profile saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const itemList = items.data ?? [];
  const goalCount = itemList.filter(isGoal).length;
  const daysSince = profile.data?.created_at
    ? differenceInDays(new Date(), new Date(profile.data.created_at))
    : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10 pb-24">
      <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
        <h1 className="font-display text-4xl italic text-foreground">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your presence in the universe.</p>
      </div>

      <GlassPanel className="flex items-center gap-5 p-6 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <Avatar className="h-16 w-16 shadow-glow-rose">
          {profile.data?.avatar_url ? <AvatarImage src={profile.data.avatar_url} alt="Avatar" /> : null}
          <AvatarFallback className="chrome-surface font-display text-lg">
            {initials(profile.data?.display_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-display text-xl italic text-foreground">
            {profile.data?.display_name ?? "Unnamed dreamer"}
          </p>
          <p className="text-xs text-muted-foreground">
            Joined {daysSince <= 0 ? "today" : `${daysSince} day${daysSince === 1 ? "" : "s"} ago`}
          </p>
        </div>
      </GlassPanel>

      <GlassPanel className="flex flex-col gap-4 p-6 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Details</h2>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="display_name" className="text-xs text-muted-foreground">
            Display name
          </label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-xs text-muted-foreground">
            Bio
          </label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A little about who you're becoming…"
            rows={4}
          />
        </div>
        <Button
          variant="chrome"
          className="w-fit rounded-full"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </GlassPanel>

      <GlassPanel className="p-6 animate-fade-up" style={{ animationDelay: "180ms" }}>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">Stats</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Sections" value={sections.data?.length ?? 0} />
          <Stat label="Items" value={itemList.length} />
          <Stat label="Goals" value={goalCount} />
          <Stat label="Days" value={daysSince} />
        </div>
      </GlassPanel>

      <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            void signOut().then(() => navigate({ to: "/" }));
          }}
        >
          <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Sign out
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-2xl text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
