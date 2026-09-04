CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL,
  requester_contact text,
  part_description text NOT NULL,
  file_type_needed text NOT NULL DEFAULT 'Either',
  make text,
  model text,
  year_from text,
  year_to text,
  engine_manufacturer text,
  engine_series text,
  engine_displacement text,
  generation text,
  drivetrain text,
  bounty_amount numeric,
  status text NOT NULL DEFAULT 'open',
  fulfilled_part_id uuid REFERENCES public.parts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.requests TO anon;
GRANT SELECT, INSERT ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view requests"
  ON public.requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can post a request"
  ON public.requests FOR INSERT
  WITH CHECK (status = 'open' AND fulfilled_part_id IS NULL);

CREATE TRIGGER requests_set_updated_at
  BEFORE UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.parts
  ADD COLUMN request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL;