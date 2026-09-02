ALTER TABLE public.parts ADD COLUMN contributor_type text NOT NULL DEFAULT 'Other';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts TO authenticated;
GRANT ALL ON public.parts TO service_role;

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;