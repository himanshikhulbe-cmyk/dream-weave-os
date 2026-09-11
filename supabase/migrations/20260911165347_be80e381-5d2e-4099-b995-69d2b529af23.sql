-- Enums
CREATE TYPE public.item_type AS ENUM ('image','video','audio','text','document');
CREATE TYPE public.item_status AS ENUM ('idea','planned','in_progress','completed','archived');
CREATE TYPE public.text_kind AS ENUM ('note','goal','quote','journal','reflection','manifestation','idea','plan');
CREATE TYPE public.reflection_kind AS ENUM ('reflection','reminder','future_self','pattern');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sections (nested)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  cover_url TEXT,
  color TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  last_visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sections_user_idx ON public.sections(user_id);
CREATE INDEX sections_parent_idx ON public.sections(parent_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sections_own" ON public.sections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER sections_updated_at BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vision items
CREATE TABLE public.vision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  type public.item_type NOT NULL,
  title TEXT,
  body TEXT,
  caption TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  moods TEXT[] NOT NULL DEFAULT '{}',
  status public.item_status NOT NULL DEFAULT 'idea',
  priority SMALLINT NOT NULL DEFAULT 0,
  progress SMALLINT NOT NULL DEFAULT 0,
  deadline DATE,
  target_year INTEGER,
  media_path TEXT,
  thumbnail_path TEXT,
  mime_type TEXT,
  file_size BIGINT,
  duration_seconds REAL,
  transcript TEXT,
  embed_url TEXT,
  text_kind public.text_kind,
  x REAL NOT NULL DEFAULT 0,
  y REAL NOT NULL DEFAULT 0,
  w REAL NOT NULL DEFAULT 280,
  h REAL NOT NULL DEFAULT 200,
  rotation REAL NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 1,
  pinned BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  group_id UUID,
  color TEXT,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vision_items_user_idx ON public.vision_items(user_id);
CREATE INDEX vision_items_section_idx ON public.vision_items(section_id);
CREATE INDEX vision_items_tags_idx ON public.vision_items USING GIN(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vision_items TO authenticated;
GRANT ALL ON public.vision_items TO service_role;
ALTER TABLE public.vision_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vision_items_own" ON public.vision_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER vision_items_updated_at BEFORE UPDATE ON public.vision_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Connections between items
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_item_id UUID NOT NULL REFERENCES public.vision_items(id) ON DELETE CASCADE,
  to_item_id UUID NOT NULL REFERENCES public.vision_items(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_item_id, to_item_id)
);
CREATE INDEX connections_user_idx ON public.connections(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "connections_own" ON public.connections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved layouts
CREATE TABLE public.layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'static',
  positions JSONB NOT NULL DEFAULT '{}'::jsonb,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX layouts_user_idx ON public.layouts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layouts TO authenticated;
GRANT ALL ON public.layouts TO service_role;
ALTER TABLE public.layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "layouts_own" ON public.layouts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER layouts_updated_at BEFORE UPDATE ON public.layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI reflections
CREATE TABLE public.ai_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind public.reflection_kind NOT NULL,
  content TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_reflections_user_idx ON public.ai_reflections(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_reflections TO authenticated;
GRANT ALL ON public.ai_reflections TO service_role;
ALTER TABLE public.ai_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_reflections_own" ON public.ai_reflections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage policies for private vision-media bucket (files live under <user_id>/...)
CREATE POLICY "vision_media_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vision-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "vision_media_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vision-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "vision_media_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vision-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "vision_media_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vision-media' AND auth.uid()::text = (storage.foldername(name))[1]);