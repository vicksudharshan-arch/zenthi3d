ALTER TABLE public.parts ALTER COLUMN contributor_type DROP DEFAULT;
ALTER TABLE public.parts ALTER COLUMN contributor_type TYPE text[] USING ARRAY[contributor_type];
ALTER TABLE public.parts ALTER COLUMN contributor_type SET DEFAULT '{}'::text[];