CREATE TABLE public.copyright_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  part_reference text NOT NULL,
  concern text NOT NULL,
  good_faith boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.copyright_reports TO anon, authenticated;
GRANT ALL ON public.copyright_reports TO service_role;

ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a copyright report"
  ON public.copyright_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (good_faith = true AND status = 'open');

CREATE POLICY "Service role manages copyright reports"
  ON public.copyright_reports FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER set_copyright_reports_updated_at
  BEFORE UPDATE ON public.copyright_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();