import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  Connection,
  Layout,
  Profile,
  Section,
  SectionInsert,
  SectionUpdate,
  VisionItem,
  VisionItemInsert,
  VisionItemUpdate,
  AiReflection,
  Notification,
} from "./types";

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const keys = {
  profile: ["profile"] as const,
  sections: ["sections"] as const,
  items: (sectionId?: string | null) => ["items", sectionId ?? "all"] as const,
  allItems: ["items", "all"] as const,
  connections: ["connections"] as const,
  layouts: ["layouts"] as const,
  reflections: ["reflections"] as const,
  notifications: ["notifications"] as const,
  mediaUrl: (path: string) => ["media-url", path] as const,
};

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export const profileQuery = queryOptions({
  queryKey: keys.profile,
  queryFn: async (): Promise<Profile | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
    const meta = (auth.user.user_metadata ?? {}) as Record<string, string | undefined>;
    const { data: created, error: insErr } = await supabase
      .from("profiles")
      .insert({
        id: auth.user.id,
        display_name:
          meta["full_name"] ?? meta["name"] ?? auth.user.email?.split("@")[0] ?? null,
        avatar_url: meta["avatar_url"] ?? meta["picture"] ?? null,
      })
      .select("*")
      .single();
    if (insErr) throw insErr;
    return created;
  },
});

export const sectionsQuery = queryOptions({
  queryKey: keys.sections,
  queryFn: async (): Promise<Section[]> => {
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const allItemsQuery = queryOptions({
  queryKey: keys.allItems,
  queryFn: async (): Promise<VisionItem[]> => {
    const { data, error } = await supabase
      .from("vision_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const sectionItemsQuery = (sectionId: string) =>
  queryOptions({
    queryKey: keys.items(sectionId),
    queryFn: async (): Promise<VisionItem[]> => {
      const { data, error } = await supabase
        .from("vision_items")
        .select("*")
        .eq("section_id", sectionId)
        .order("z_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

export const connectionsQuery = queryOptions({
  queryKey: keys.connections,
  queryFn: async (): Promise<Connection[]> => {
    const { data, error } = await supabase.from("connections").select("*");
    if (error) throw error;
    return data;
  },
});

export const layoutsQuery = queryOptions({
  queryKey: keys.layouts,
  queryFn: async (): Promise<Layout[]> => {
    const { data, error } = await supabase
      .from("layouts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const reflectionsQuery = queryOptions({
  queryKey: keys.reflections,
  queryFn: async (): Promise<AiReflection[]> => {
    const { data, error } = await supabase
      .from("ai_reflections")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
});

export const notificationsQuery = queryOptions({
  queryKey: keys.notifications,
  queryFn: async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },
});

/** Signed URL for a private media path; cached for ~6 days. */
export const mediaUrlQuery = (path: string | null | undefined) =>
  queryOptions({
    queryKey: keys.mediaUrl(path ?? ""),
    enabled: !!path,
    staleTime: 1000 * 60 * 60 * 24 * 6,
    gcTime: 1000 * 60 * 60 * 24 * 6,
    queryFn: async (): Promise<string | null> => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from("vision-media")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (error) throw error;
      return data.signedUrl;
    },
  });

/* ------------------------------------------------------------------ */
/* Mutations (plain async helpers — wrap with useMutation)             */
/* ------------------------------------------------------------------ */

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function createSection(input: Omit<SectionInsert, "user_id">) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("sections")
    .insert({ ...input, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSection(id: string, patch: SectionUpdate) {
  const { data, error } = await supabase
    .from("sections")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSection(id: string) {
  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateSection(section: Section, items: VisionItem[]) {
  const user_id = await uid();
  const { data: copy, error } = await supabase
    .from("sections")
    .insert({
      user_id,
      parent_id: section.parent_id,
      name: `${section.name} (copy)`,
      description: section.description,
      icon: section.icon,
      cover_url: section.cover_url,
      color: section.color,
      tags: section.tags,
      sort_order: section.sort_order + 1,
    })
    .select("*")
    .single();
  if (error) throw error;
  if (items.length) {
    const rows = items.map((it) => {
      const { id: _id, created_at: _c, updated_at: _u, ...rest } = it;
      return { ...rest, section_id: copy.id, user_id };
    });
    const { error: e2 } = await supabase.from("vision_items").insert(rows);
    if (e2) throw e2;
  }
  return copy;
}

export async function reorderSections(ids: string[]) {
  await Promise.all(
    ids.map((id, i) => supabase.from("sections").update({ sort_order: i }).eq("id", id)),
  );
}

export async function touchSection(id: string) {
  await supabase.from("sections").update({ last_visited_at: new Date().toISOString() }).eq("id", id);
}

export async function createItem(input: Omit<VisionItemInsert, "user_id">) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("vision_items")
    .insert({ ...input, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(id: string, patch: VisionItemUpdate) {
  const { data, error } = await supabase
    .from("vision_items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateItemPositions(
  updates: { id: string; x?: number; y?: number; w?: number; h?: number; rotation?: number; z_index?: number }[],
) {
  await Promise.all(
    updates.map(({ id, ...patch }) => supabase.from("vision_items").update(patch).eq("id", id)),
  );
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("vision_items").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateItem(item: VisionItem) {
  const user_id = await uid();
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = item;
  const { data, error } = await supabase
    .from("vision_items")
    .insert({ ...rest, user_id, x: item.x + 24, y: item.y + 24, z_index: item.z_index + 1 })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function touchItem(id: string) {
  await supabase.from("vision_items").update({ last_viewed_at: new Date().toISOString() }).eq("id", id);
}

export async function createConnection(from_item_id: string, to_item_id: string, label?: string) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("connections")
    .insert({ user_id, from_item_id, to_item_id, label: label ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteConnection(id: string) {
  const { error } = await supabase.from("connections").delete().eq("id", id);
  if (error) throw error;
}

export type LayoutPositions = Record<
  string,
  { x: number; y: number; w: number; h: number; rotation: number; z_index: number }
>;

export async function saveLayout(input: {
  name: string;
  section_id?: string | null;
  mode: string;
  positions: LayoutPositions;
  filters?: Record<string, string | number | boolean | null>;
}) {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("layouts")
    .insert({
      name: input.name,
      section_id: input.section_id ?? null,
      mode: input.mode,
      user_id,
      positions: input.positions as unknown as Json,
      filters: (input.filters ?? {}) as unknown as Json,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLayout(id: string) {
  const { error } = await supabase.from("layouts").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProfile(patch: Partial<Profile>) {
  const id = await uid();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function markNotificationRead(id: string) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

/** Upload a file to the private vision-media bucket. Returns the storage path. */
export async function uploadMedia(file: File | Blob, opts?: { ext?: string; folder?: string }) {
  const user_id = await uid();
  const ext =
    opts?.ext ??
    (file instanceof File && file.name.includes(".") ? file.name.split(".").pop()! : "bin");
  const path = `${user_id}/${opts?.folder ?? "media"}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("vision-media").upload(path, file, {
    ...(file.type ? { contentType: file.type } : {}),
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteMedia(path: string) {
  await supabase.storage.from("vision-media").remove([path]);
}
