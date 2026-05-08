
-- Timestamp helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FOLDERS
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own folders" ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own folders" ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own folders" ON public.folders FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX folders_user_id_idx ON public.folders(user_id);
CREATE INDEX folders_parent_id_idx ON public.folders(parent_id);

-- MEETINGS
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  meeting_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_time TEXT,
  duration INTEGER,
  transcript TEXT NOT NULL DEFAULT '',
  summary JSONB,
  source_type TEXT NOT NULL DEFAULT 'text',
  manual_notes TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own meetings" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX meetings_user_id_idx ON public.meetings(user_id);
CREATE INDEX meetings_folder_id_idx ON public.meetings(folder_id);

-- CALENDAR NOTES
CREATE TABLE public.calendar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  start_time TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users select own calendar notes" ON public.calendar_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own calendar notes" ON public.calendar_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own calendar notes" ON public.calendar_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own calendar notes" ON public.calendar_notes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER calendar_notes_updated_at BEFORE UPDATE ON public.calendar_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX calendar_notes_user_id_idx ON public.calendar_notes(user_id);
