CREATE TABLE public.external_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  source_site text,
  license text,
  note text,
  status text NOT NULL DEFAULT 'new',
  suggested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.external_leads TO authenticated;
GRANT ALL ON public.external_leads TO service_role;

ALTER TABLE public.external_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can suggest leads"
ON public.external_leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Members read own leads"
ON public.external_leads FOR SELECT TO authenticated
USING (auth.uid() = suggested_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update leads"
ON public.external_leads FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete leads"
ON public.external_leads FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX external_leads_created_idx ON public.external_leads (created_at DESC);