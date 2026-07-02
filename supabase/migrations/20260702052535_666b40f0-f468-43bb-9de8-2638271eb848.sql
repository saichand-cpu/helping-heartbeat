
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession text;

-- Trigram indexes for fuzzy search across name, username, profession
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS profiles_full_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_profession_trgm ON public.profiles USING gin (profession gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_location_trgm ON public.profiles USING gin (location gin_trgm_ops);
