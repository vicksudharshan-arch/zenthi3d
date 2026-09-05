-- Column-level privileges: hide requester_contact from public/authenticated reads
REVOKE SELECT ON public.requests FROM anon, authenticated;

GRANT SELECT (
  id, requester_name, part_description, file_type_needed,
  make, model, year_from, year_to,
  engine_manufacturer, engine_series, engine_displacement,
  generation, drivetrain, bounty_amount, status,
  fulfilled_part_id, created_at, updated_at
) ON public.requests TO anon, authenticated;

GRANT INSERT ON public.requests TO anon, authenticated;
GRANT ALL ON public.requests TO service_role;